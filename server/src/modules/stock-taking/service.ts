import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../generated/prisma/client.js';import { AppError } from '../../middlewares/errorHandler.ts';
import { applyFifoConsumption, InsufficientStockError } from '../inventory/fifo.ts';

export interface CreateStockTakeInput {
  warehouseId: string;
  createdBy: string;
}

export interface SubmitCountInput {
  sessionId: string;
  inventoryItemId: string;
  physicalQuantity: number;
  countedBy: string;
}

export interface ApproveReconciliationInput {
  reconciliationId: string;
  reason: string;
  unitCost?: number;
  approvedBy: string;
}

export interface RejectReconciliationInput {
  reconciliationId: string;
  reason: string;
  approvedBy: string;
}

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

const ensureWarehouse = async (
  tx: Prisma.TransactionClient,
  warehouseId: string
) => {  const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }
  return warehouse;
};

export const createStockTake = async (input: CreateStockTakeInput) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      await ensureWarehouse(tx, input.warehouseId);

      return tx.stockTake.create({
        data: {
          warehouseId: input.warehouseId,
          createdBy: input.createdBy,
          status: 'DRAFT',
          startedAt: new Date(),
        },
      });
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const submitStockTakeCount = async (input: SubmitCountInput) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.stockTake.findUnique({
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new AppError('Stock-take session not found', 404);
      }

      if (session.status === 'COMPLETED') {
        throw new AppError('Completed stock-take sessions cannot accept counts', 400);
      }

      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: input.inventoryItemId },
      });

      if (!inventoryItem) {
        throw new AppError('Inventory item not found', 404);
      }

      if (inventoryItem.warehouseId !== session.warehouseId) {
        throw new AppError('Inventory item does not belong to the stock-take warehouse', 400);
      }

      const existingCount = await tx.stockTakeCount.findUnique({
        where: {
          stockTakeId_inventoryItemId: {
            stockTakeId: input.sessionId,
            inventoryItemId: input.inventoryItemId,
          },
        },
      });

      if (existingCount) {
        throw new AppError('Inventory item has already been counted in this session', 409);
      }

      const binCard = await tx.binCard.findUnique({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: input.inventoryItemId,
            warehouseId: session.warehouseId,
          },
        },
      });

      const systemQuantity = binCard?.balance ?? 0;
      const discrepancy = input.physicalQuantity - systemQuantity;
      const hasDiscrepancy = discrepancy !== 0;

      const count = await tx.stockTakeCount.create({
        data: {
          stockTakeId: input.sessionId,
          inventoryItemId: input.inventoryItemId,
          systemQuantity,
          physicalQuantity: input.physicalQuantity,
          discrepancy,
          hasDiscrepancy,
          countedBy: input.countedBy,
        },
        include: { reconciliation: true },
      });

      let reconciliation = null;
      if (hasDiscrepancy) {
        reconciliation = await tx.reconciliation.create({
          data: {
            stockTakeCountId: count.id,
            inventoryItemId: input.inventoryItemId,
            warehouseId: session.warehouseId,
            discrepancy,
            status: 'PENDING',
          },
        });
      }

      if (session.status === 'DRAFT') {
        await tx.stockTake.update({
          where: { id: input.sessionId },
          data: { status: 'COUNTING' },
        });
      }

      return { ...count, reconciliation };
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getStockTake = async (sessionId: string) => {
  const prisma = getPrisma();

  try {
    const session = await prisma.stockTake.findUnique({
      where: { id: sessionId },
      include: {
        counts: {
          include: {
            inventoryItem: true,
            reconciliation: true,
          },
          orderBy: { countedAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new AppError('Stock-take session not found', 404);
    }

    return session;
  } finally {
    await prisma.$disconnect();
  }
};

export const completeStockTake = async (sessionId: string) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.stockTake.findUnique({ where: { id: sessionId } });
      if (!session) {
        throw new AppError('Stock-take session not found', 404);
      }
      if (session.status === 'COMPLETED') {
        throw new AppError('Stock-take session is already completed', 409);
      }

      return tx.stockTake.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getReconciliations = async (sessionId: string) => {
  const prisma = getPrisma();

  try {
    const session = await prisma.stockTake.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError('Stock-take session not found', 404);
    }

    return await prisma.reconciliation.findMany({
      where: { stockTakeCount: { stockTakeId: sessionId } },
      include: {
        stockTakeCount: true,
        inventoryItem: true,
        warehouse: true,
        approver: true,
        adjustmentTransaction: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getPendingReconciliation = async (
  tx: Prisma.TransactionClient,
  reconciliationId: string
) => {  const reconciliation = await tx.reconciliation.findUnique({
    where: { id: reconciliationId },
    include: { stockTakeCount: true },
  });

  if (!reconciliation) {
    throw new AppError('Reconciliation not found', 404);
  }

  if (reconciliation.status !== 'PENDING') {
    throw new AppError('Reconciliation has already been processed', 409);
  }

  return reconciliation;
};

const writeReconciliationAudit = async (
  tx: Prisma.TransactionClient,
  action: string,
  reconciliationId: string,
  userId: string,
  details: Prisma.InputJsonValue
) => {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      entity: 'Reconciliation',
      entityId: reconciliationId,
      details,
    },
  });
};

export const approveReconciliation = async (input: ApproveReconciliationInput) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      const reconciliation = await getPendingReconciliation(tx, input.reconciliationId);
      const count = reconciliation.stockTakeCount;
      const currentBinCard = await tx.binCard.findUnique({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: reconciliation.inventoryItemId,
            warehouseId: reconciliation.warehouseId,
          },
        },
      });
      const currentQuantity = currentBinCard?.balance ?? 0;

      if (currentQuantity !== count.systemQuantity) {
        throw new AppError('Inventory quantity changed since the physical count', 409);
      }

      const adjustmentQuantity = reconciliation.discrepancy;
      if (adjustmentQuantity === 0) {
        throw new AppError('Zero discrepancies do not require reconciliation', 400);
      }

      const claim = await tx.reconciliation.updateMany({
        where: { id: input.reconciliationId, status: 'PENDING' },
        data: { status: 'APPLIED' },
      });

      if (claim.count !== 1) {
        throw new AppError('Reconciliation has already been processed', 409);
      }

      const now = new Date();
      let adjustmentTransaction: Awaited<ReturnType<typeof tx.stockTransaction.create>>;

      if (adjustmentQuantity < 0) {
        const quantityToConsume = Math.abs(adjustmentQuantity);
        const activeLots = await tx.stockLot.findMany({
          where: {
            inventoryItemId: reconciliation.inventoryItemId,
            isDepleted: false,
            quantityRemaining: { gt: 0 },
          },
          orderBy: { receivedDate: 'asc' },
        });

        let fifoResult;
        try {
          fifoResult = applyFifoConsumption(activeLots, quantityToConsume);
        } catch (error) {
          if (error instanceof InsufficientStockError) {
            throw new AppError('Insufficient stock available for reconciliation', 409);
          }
          throw error;
        }

        for (const updatedLot of fifoResult.updatedLots) {
          const original = activeLots.find((lot) => lot.id === updatedLot.id);
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

        const unitCost = fifoResult.totalValue / quantityToConsume;
        adjustmentTransaction = await tx.stockTransaction.create({
          data: {
            type: 'ADJUSTMENT',
            inventoryItemId: reconciliation.inventoryItemId,
            warehouseId: reconciliation.warehouseId,
            quantity: adjustmentQuantity,
            unitCost,
            totalValue: -fifoResult.totalValue,
            receivedDate: now,
            referenceNumber: `STOCK-TAKE:${reconciliation.stockTakeCountId}`,
            userId: input.approvedBy,
          },
        });

        await tx.lotConsumption.createMany({
          data: fifoResult.consumptions.map((consumption) => ({
            stockLotId: consumption.stockLotId,
            stockTransactionId: adjustmentTransaction.id,
            quantityConsumed: consumption.quantityConsumed,
          })),
        });
      } else {
        if (typeof input.unitCost !== 'number' || !Number.isFinite(input.unitCost) || input.unitCost < 0) {
          throw new AppError('unitCost is required for positive discrepancies', 400);
        }

        await tx.stockLot.create({
          data: {
            inventoryItemId: reconciliation.inventoryItemId,
            quantityReceived: adjustmentQuantity,
            quantityRemaining: adjustmentQuantity,
            unitCost: input.unitCost,
            receivedDate: now,
            isDepleted: false,
          },
        });

        adjustmentTransaction = await tx.stockTransaction.create({
          data: {
            type: 'ADJUSTMENT',
            inventoryItemId: reconciliation.inventoryItemId,
            warehouseId: reconciliation.warehouseId,
            quantity: adjustmentQuantity,
            unitCost: input.unitCost,
            totalValue: adjustmentQuantity * input.unitCost,
            receivedDate: now,
            referenceNumber: `STOCK-TAKE:${reconciliation.stockTakeCountId}`,
            userId: input.approvedBy,
          },
        });
      }

      const newBalance = currentQuantity + adjustmentQuantity;
      const binCard = await tx.binCard.upsert({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: reconciliation.inventoryItemId,
            warehouseId: reconciliation.warehouseId,
          },
        },
        update: { balance: newBalance, lastUpdated: now },
        create: {
          inventoryItemId: reconciliation.inventoryItemId,
          warehouseId: reconciliation.warehouseId,
          balance: newBalance,
          lastUpdated: now,
        },
      });

      const result = await tx.reconciliation.update({
        where: { id: input.reconciliationId },
        data: {
          status: 'APPLIED',
          reason: input.reason,
          ...(adjustmentQuantity > 0 ? { unitCost: input.unitCost } : {}),
          approvedBy: input.approvedBy,
          approvedAt: now,
          appliedAt: now,
          adjustmentTransactionId: adjustmentTransaction.id,
        },
      });

      await writeReconciliationAudit(tx, 'RECONCILIATION_APPLIED', input.reconciliationId, input.approvedBy, {
        discrepancy: adjustmentQuantity,
        adjustmentTransactionId: adjustmentTransaction.id,
      });

      return { reconciliation: result, transaction: adjustmentTransaction, binCard };
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const rejectReconciliation = async (input: RejectReconciliationInput) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      await getPendingReconciliation(tx, input.reconciliationId);
      const now = new Date();
      const result = await tx.reconciliation.update({
        where: { id: input.reconciliationId },
        data: {
          status: 'REJECTED',
          reason: input.reason,
          approvedBy: input.approvedBy,
          approvedAt: now,
        },
      });

      await writeReconciliationAudit(tx, 'RECONCILIATION_REJECTED', input.reconciliationId, input.approvedBy, {
        reason: input.reason,
      });

      return result;
    });
  } finally {
    await prisma.$disconnect();
  }
};