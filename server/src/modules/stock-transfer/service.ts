import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface CreateTransferInput {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  referenceNumber?: string;
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

export const createStockTransfer = async (
  input: CreateTransferInput,
) => {
  const prisma = createPrismaClient();

  try {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: {
          id: input.itemId,
        },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const sourceWarehouse = await tx.warehouse.findUnique({
        where: {
          id: input.fromWarehouseId,
        },
      });

      if (!sourceWarehouse) {
        throw new AppError('Source warehouse not found', 404);
      }

      const destinationWarehouse = await tx.warehouse.findUnique({
        where: {
          id: input.toWarehouseId,
        },
      });

      if (!destinationWarehouse) {
        throw new AppError('Destination warehouse not found', 404);
      }

      const sourceBinCard = await tx.binCard.findUnique({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: input.itemId,
            warehouseId: input.fromWarehouseId,
          },
        },
      });

      if (!sourceBinCard) {
        throw new AppError('Source stock record not found', 404);
      }

      if (sourceBinCard.balance < input.quantity) {
        throw new AppError(
          `Insufficient stock. Available stock: ${sourceBinCard.balance}`,
          400,
        );
      }

      /*
       * Atomically deduct the source quantity.
       *
       * The balance >= quantity condition protects against a concurrent
       * transfer making the source balance insufficient between the read
       * above and this update.
       */
      const sourceUpdate = await tx.binCard.updateMany({
        where: {
          id: sourceBinCard.id,
          balance: {
            gte: input.quantity,
          },
        },
        data: {
          balance: {
            decrement: input.quantity,
          },
          lastUpdated: new Date(),
        },
      });

      if (sourceUpdate.count !== 1) {
        throw new AppError(
          'Insufficient stock. Source stock changed before transfer could be completed',
          400,
        );
      }

      const destinationBinCard = await tx.binCard.upsert({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: input.itemId,
            warehouseId: input.toWarehouseId,
          },
        },
        update: {
          balance: {
            increment: input.quantity,
          },
          lastUpdated: new Date(),
        },
        create: {
          inventoryItemId: input.itemId,
          warehouseId: input.toWarehouseId,
          balance: input.quantity,
          lastUpdated: new Date(),
        },
      });

      /*
       * The current StockTransaction schema stores one warehouseId.
       * For a transfer, this is the source warehouse.
       *
       * The destination warehouse is preserved in the authenticated
       * request/audit trail through the existing auditLogger middleware.
       */
      const sourceTransaction = await tx.stockTransaction.findFirst({
        where: {
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const unitCost = sourceTransaction?.unitCost ?? null;

      const transaction = await tx.stockTransaction.create({
        data: {
          type: 'TRANSFER',
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
          quantity: input.quantity,
          unitCost,
          totalValue:
            unitCost !== null
              ? input.quantity * unitCost
              : null,
          referenceNumber: input.referenceNumber ?? null,
          userId: input.userId,
        },
      });

      return {
        transaction,
        sourceWarehouseId: input.fromWarehouseId,
        destinationWarehouseId: input.toWarehouseId,
        quantity: input.quantity,
        sourceBalance: sourceBinCard.balance - input.quantity,
        destinationBalance: destinationBinCard.balance,
      };
    });
  } finally {
    await prisma.$disconnect();
  }
};