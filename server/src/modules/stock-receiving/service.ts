import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

interface ReceivingItemInput {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  inspectionStatus: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
}

export interface CreateReceivingInput {
  supplierId: string;
  warehouseId: string;
  receivedDate?: string;
  items: ReceivingItemInput[];
}

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }

  return databaseUrl;
};

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
};

export const createReceiving = async (
  input: CreateReceivingInput,
  receivedBy: string
) => {
  const prisma = createPrismaClient();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: input.supplierId },
      });

      if (!supplier) {
        throw new AppError('Supplier not found', 404);
      }

      if (supplier.isActive === false) {
        throw new AppError('Supplier is inactive', 400);
      }

      const warehouse = await tx.warehouse.findUnique({
        where: { id: input.warehouseId },
      });

      if (!warehouse) {
        throw new AppError('Warehouse not found', 404);
      }

      const user = await tx.user.findUnique({
        where: { id: receivedBy },
      });

      if (!user) {
        throw new AppError('Receiving user not found', 404);
      }

      for (const item of input.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (!inventoryItem) {
          throw new AppError(
            `Inventory item not found: ${item.inventoryItemId}`,
            404
          );
        }

        if (inventoryItem.warehouseId !== input.warehouseId) {
          throw new AppError(
            `Inventory item ${inventoryItem.itemCode} does not belong to the selected warehouse`,
            400
          );
        }

        if (
          item.inspectionStatus === 'REJECTED' &&
          !item.rejectionReason?.trim()
        ) {
          throw new AppError(
            `Rejection reason is required for item ${inventoryItem.itemCode}`,
            400
          );
        }
      }

      const year = new Date(
        input.receivedDate ?? new Date().toISOString()
      ).getFullYear();

      const count = await tx.goodsReceivingNote.count({
        where: {
          receivedDate: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      });

      const grnNumber = `GRN-${year}-${String(count + 1).padStart(5, '0')}`;

      const grn = await tx.goodsReceivingNote.create({
        data: {
          grnNumber,
          supplierId: input.supplierId,
          warehouseId: input.warehouseId,
          receivedDate: input.receivedDate
            ? new Date(input.receivedDate)
            : new Date(),
          receivedBy,
          items: {
            create: input.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              inspectionStatus: item.inspectionStatus,
              rejectionReason:
                item.inspectionStatus === 'REJECTED'
                  ? item.rejectionReason?.trim()
                  : null,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of input.items) {
        if (item.inspectionStatus !== 'ACCEPTED') {
          continue;
        }

        await tx.stockLot.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            quantityReceived: item.quantity,
            quantityRemaining: item.quantity,
            unitCost: item.unitCost,
            receivedDate: grn.receivedDate,
          },
        });

        await tx.stockTransaction.create({
          data: {
            type: 'RECEIVE',
            inventoryItemId: item.inventoryItemId,
            warehouseId: input.warehouseId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalValue: item.quantity * item.unitCost,
            receivedDate: grn.receivedDate,
            referenceNumber: grn.grnNumber,
            supplierId: input.supplierId,
            userId: receivedBy,
          },
        });

        const binCard = await tx.binCard.findUnique({
          where: {
            inventoryItemId_warehouseId: {
              inventoryItemId: item.inventoryItemId,
              warehouseId: input.warehouseId,
            },
          },
        });

        if (binCard) {
          await tx.binCard.update({
            where: { id: binCard.id },
            data: {
              balance: {
                increment: item.quantity,
              },
              lastUpdated: grn.receivedDate,
            },
          });
        } else {
          await tx.binCard.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              warehouseId: input.warehouseId,
              balance: item.quantity,
              lastUpdated: grn.receivedDate,
            },
          });
        }

        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            state: 'AVAILABLE',
          },
        });
      }

      return grn;
    });

    return result;
  } finally {
    await prisma.$disconnect();
  }
};
