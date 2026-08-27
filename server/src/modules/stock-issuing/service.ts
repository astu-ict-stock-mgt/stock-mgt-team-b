import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import { applyFifoConsumption, InsufficientStockError } from '../inventory/fifo.ts';

export interface IssueStockInput {
  inventoryItemId: string;
  warehouseId: string;
  quantity: number;
  requisitionNumber: string;
  isApproved: boolean;
  userId: string;
}

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

export const issueStock = async (input: IssueStockInput) => {
  if (!input.isApproved) {
    throw new AppError('Inventory cannot be issued without an approved requisition form', 400);
  }

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const itemExists = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!itemExists) {
      throw new AppError('Inventory item not found', 404);
    }

    const warehouseExists = await tx.warehouse.findUnique({
      where: { id: input.warehouseId },
    });
    if (!warehouseExists) {
      throw new AppError('Warehouse not found', 404);
    }

    const activeLots = await tx.stockLot.findMany({
      where: {
        inventoryItemId: input.inventoryItemId,
        isDepleted: false,
        quantityRemaining: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });

    let fifoResult;
    try {
      fifoResult = applyFifoConsumption(activeLots, input.quantity);
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw new AppError('Insufficient stock available', 400);
      }
      throw error;
    }

    for (const updatedLot of fifoResult.updatedLots) {
      const original = activeLots.find((l) => l.id === updatedLot.id);
      if (
        original &&
        (original.quantityRemaining !== updatedLot.quantityRemaining ||
          original.isDepleted !== updatedLot.isDepleted)
      ) {
        await tx.stockLot.update({
          where: { id: updatedLot.id },
          data: {
            quantityRemaining: updatedLot.quantityRemaining,
            isDepleted: updatedLot.isDepleted,
          },
        });
      }
    }

    const unitCost =
      fifoResult.totalQuantity > 0 ? fifoResult.totalValue / fifoResult.totalQuantity : 0;

    const transaction = await tx.stockTransaction.create({
      data: {
        type: 'ISSUE',
        inventoryItemId: input.inventoryItemId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        unitCost,
        totalValue: fifoResult.totalValue,
        referenceNumber: input.requisitionNumber,
        userId: input.userId,
      },
    });

    await tx.lotConsumption.createMany({
      data: fifoResult.consumptions.map((consumption) => ({
        stockLotId: consumption.stockLotId,
        stockTransactionId: transaction.id,
        quantityConsumed: consumption.quantityConsumed,
      })),
    });

    const existingBinCard = await tx.binCard.findUnique({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: input.inventoryItemId,
          warehouseId: input.warehouseId,
        },
      },
    });

    const currentBalance = existingBinCard ? existingBinCard.balance : 0;
    const newBalance = currentBalance - input.quantity;

    if (newBalance < 0) {
      throw new AppError('Insufficient BinCard balance available', 400);
    }

    const binCard = await tx.binCard.upsert({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: input.inventoryItemId,
          warehouseId: input.warehouseId,
        },
      },
      update: {
        balance: newBalance,
        lastUpdated: new Date(),
      },
      create: {
        inventoryItemId: input.inventoryItemId,
        warehouseId: input.warehouseId,
        balance: newBalance,
      },
    });

    return {
      transaction,
      consumptions: fifoResult.consumptions,
      binCard,
    };
  });
};
