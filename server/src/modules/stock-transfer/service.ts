import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export interface CreateTransferInput {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  referenceNumber?: string;
}

export async function createStockTransfer(input: CreateTransferInput) {
  if (input.quantity <= 0) {
    throw new Error('Transfer quantity must be greater than zero');
  }

  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new Error('Source and destination warehouses must be different');
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: {
        id: input.itemId,
      },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    const sourceTransaction = await tx.stockTransaction.findFirst({
      where: {
        inventoryItemId: input.itemId,
        warehouseId: input.fromWarehouseId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const sourceBinCard = await tx.binCard.findUnique({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
        },
      },
    });

    const currentSourceBalance = sourceBinCard?.balance ?? 0;

    if (currentSourceBalance < input.quantity) {
      throw new Error(
        `Insufficient stock. Available stock: ${currentSourceBalance}`,
      );
    }

    const destinationBinCard = await tx.binCard.findUnique({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: input.itemId,
          warehouseId: input.toWarehouseId,
        },
      },
    });

    const newSourceBalance = currentSourceBalance - input.quantity;
    const newDestinationBalance =
      (destinationBinCard?.balance ?? 0) + input.quantity;

    if (sourceBinCard) {
      await tx.binCard.update({
        where: {
          id: sourceBinCard.id,
        },
        data: {
          balance: newSourceBalance,
          lastUpdated: new Date(),
        },
      });
    } else {
      await tx.binCard.create({
        data: {
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
          balance: newSourceBalance,
          lastUpdated: new Date(),
        },
      });
    }

    if (destinationBinCard) {
      await tx.binCard.update({
        where: {
          id: destinationBinCard.id,
        },
        data: {
          balance: newDestinationBalance,
          lastUpdated: new Date(),
        },
      });
    } else {
      await tx.binCard.create({
        data: {
          inventoryItemId: input.itemId,
          warehouseId: input.toWarehouseId,
          balance: newDestinationBalance,
          lastUpdated: new Date(),
        },
      });
    }

    const transaction = await tx.stockTransaction.create({
      data: {
        type: 'TRANSFER',
        inventoryItemId: input.itemId,
        warehouseId: input.fromWarehouseId,
        quantity: input.quantity,
        unitCost: sourceTransaction?.unitCost ?? null,
        totalValue: sourceTransaction?.unitCost
          ? sourceTransaction.unitCost * input.quantity
          : null,
        referenceNumber: input.referenceNumber ?? null,
        userId: input.userId,
      },
    });

    return transaction;
  });
}