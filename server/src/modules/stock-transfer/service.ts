import { getPrisma } from '../../config/db.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface CreateTransferInput {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  referenceNumber?: string;
}

export const createStockTransfer = async (
  input: CreateTransferInput,
) => {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: {
        id: input.itemId,
      },
    });

    if (!item) {
      throw new AppError(
        `Inventory item (id: ${input.itemId}) not found`,
        404,
      );
    }

    const sourceWarehouse = await tx.warehouse.findUnique({
      where: {
        id: input.fromWarehouseId,
      },
    });

    if (!sourceWarehouse) {
      throw new AppError(
        `Source warehouse (id: ${input.fromWarehouseId}) not found`,
        404,
      );
    }

    const destinationWarehouse = await tx.warehouse.findUnique({
      where: {
        id: input.toWarehouseId,
      },
    });

    if (!destinationWarehouse) {
      throw new AppError(
        `Destination warehouse (id: ${input.toWarehouseId}) not found`,
        404,
      );
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
      throw new AppError(
        `Source stock record not found for item (id: ${input.itemId}) in warehouse (id: ${input.fromWarehouseId})`,
        404,
      );
    }

    if (sourceBinCard.balance < input.quantity) {
      throw new AppError(
        `Insufficient stock for item (id: ${input.itemId}) in warehouse (id: ${input.fromWarehouseId}). ` +
        `Available: ${sourceBinCard.balance}, Required: ${input.quantity}`,
        400,
      );
    }

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
        `Insufficient stock. Source stock for item (id: ${input.itemId}) ` +
        `changed or was reduced by another transfer before this transfer could be completed. ` +
        `Available: ${sourceBinCard.balance}, Required: ${input.quantity}`,
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

    // Record audit log for tracking destination warehouse and transfer execution
    try {
      const auditLogModel = (tx as unknown as { auditLog?: { create: (args: unknown) => Promise<unknown> } }).auditLog;
      if (auditLogModel) {
        await auditLogModel.create({
          data: {
            userId: input.userId,
            action: 'STOCK_TRANSFER',
            entity: 'StockTransaction',
            entityId: transaction.id,
            details: {
              itemId: input.itemId,
              itemName: item.name,
              fromWarehouseId: input.fromWarehouseId,
              fromWarehouseName: sourceWarehouse.name,
              toWarehouseId: input.toWarehouseId,
              toWarehouseName: destinationWarehouse.name,
              quantity: input.quantity,
              referenceNumber: input.referenceNumber ?? null,
            },
          },
        });
      }
    } catch {
      // Audit log creation failure should not break transfer
    }

      /**
       * Returns transfer confirmation with updated balances.
       *
       * NOTE on balance fields:
       * - sourceBalance: Calculated as (balance at start of transaction - quantity transferred).
       *   Reflects the expected state if no concurrent updates occur.
       *   For real-time balance, query BinCard directly after response.
       * - destinationBalance: Actual balance after upsert (from Prisma response).
       *   This is the post-operation state as confirmed by the database.
       */
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
    try {
      const disc = (prisma as unknown as { $disconnect?: () => unknown }).$disconnect;
      if (typeof disc === 'function') {
        const res = disc.call(prisma);
        if (res && typeof (res as Promise<unknown>).then === 'function') {
          await res;
        }
      }
    } catch {
      // Disconnect errors ignored
    }
  }
};

export const listStockTransfers = async () => {
  const prisma = getPrisma();
  const transactions = await prisma.stockTransaction.findMany({
    where: { type: 'TRANSFER' },
    include: {
      inventoryItem: true,
      warehouse: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Lookup audit logs for destination warehouse names if recorded
  const auditDetailsMap = new Map<string, { toWarehouseId?: string; toWarehouseName?: string }>();
  try {
    const auditModel = (prisma as unknown as { auditLog?: { findMany: (args: unknown) => Promise<Array<{ entityId: string | null; details: unknown }>> } }).auditLog;
    if (auditModel && transactions.length > 0) {
      const logs = await auditModel.findMany({
        where: {
          action: 'STOCK_TRANSFER',
          entityId: { in: transactions.map((t) => t.id) },
        },
      });
      for (const log of logs) {
        if (log.entityId && log.details) {
          auditDetailsMap.set(log.entityId, log.details as { toWarehouseId?: string; toWarehouseName?: string });
        }
      }
    }
  } catch {
    // Audit log table optional in minimal test environments
  }

  return transactions.map((t) => {
    const details = auditDetailsMap.get(t.id);
    const dateObj = new Date(t.createdAt);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return {
      id: t.id,
      itemId: t.inventoryItemId,
      itemName: t.inventoryItem.name,
      itemCode: t.inventoryItem.itemCode,
      fromLocationId: t.warehouseId,
      fromLocationName: t.warehouse.name,
      toLocationId: details?.toWarehouseId || '',
      toLocationName: details?.toWarehouseName || 'Secondary Location',
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalValue: t.totalValue,
      referenceNumber: t.referenceNumber,
      date: formattedDate,
      transferDate: t.createdAt.toISOString(),
      transferredBy: t.user ? `${t.user.firstName} ${t.user.lastName}`.trim() : 'System',
      status: 'COMPLETED',
    };
  });
};

export const getTransferLocations = async () => {
  const prisma = getPrisma();
  return await prisma.warehouse.findMany({
    orderBy: { name: 'asc' },
  });
};

export const getTransferableItems = async () => {
  const prisma = getPrisma();
  const items = await prisma.inventoryItem.findMany({
    include: {
      category: true,
      BinCard: true,
    },
    orderBy: { name: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    itemCode: item.itemCode,
    category: item.category?.name || 'General',
    totalAvailable: item.BinCard.reduce((sum, b) => sum + b.balance, 0),
  }));
};

export const getItemStockLocations = async (itemId: string) => {
  const prisma = getPrisma();
  const warehouses = await prisma.warehouse.findMany({
    include: {
      BinCard: {
        where: { inventoryItemId: itemId },
      },
    },
    orderBy: { name: 'asc' },
  });

  return warehouses.map((w) => ({
    locationId: w.id,
    locationName: w.name,
    availableQuantity: w.BinCard[0]?.balance ?? 0,
  }));
};

