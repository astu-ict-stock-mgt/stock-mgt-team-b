import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import { applyFifoConsumption, InsufficientStockError } from '../inventory/fifo.ts';

export interface CreateRequisitionInput {
  inventoryItemId: string;
  warehouseId?: string;
  quantity: number;
  requisitionNumber?: string;
  justification?: string;
  isApproved?: boolean;
  userId: string;
}

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

// In-memory / transactional requisition status store for tracking pending/approved lifecycle
interface RequisitionRecord {
  id: string;
  requisitionNumber: string;
  inventoryItemId: string;
  warehouseId: string;
  quantity: number;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  rejectionReason?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sivNumber?: string;
}

const requisitionStore: Map<string, RequisitionRecord> = new Map();

/**
 * Get all requisitions / stock issuing records
 */
export const getStockRequisitions = async () => {
  const prisma = getPrisma();
  try {
    // 1. Fetch historical issue transactions from database
    const transactions = await prisma.stockTransaction.findMany({
      where: { type: 'ISSUE' },
      include: {
        inventoryItem: { select: { id: true, name: true, itemCode: true } },
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch inventory items to enrich in-memory requisitions
    const items = await prisma.inventoryItem.findMany({
      select: { id: true, name: true, itemCode: true, warehouseId: true },
    });
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, department: true },
    });

    const itemMap = new Map(items.map((i) => [i.id, i]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Format in-memory requisitions
    const reqList = Array.from(requisitionStore.values()).map((r) => {
      const it = itemMap.get(r.inventoryItemId);
      const usr = userMap.get(r.userId);
      return {
        id: r.id,
        referenceNumber: r.sivNumber || r.requisitionNumber,
        inventoryItemId: r.inventoryItemId,
        inventoryItem: it ? { name: it.name, itemCode: it.itemCode } : { name: 'Item', itemCode: 'ITEM' },
        quantity: r.quantity,
        warehouseId: r.warehouseId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: usr ? { firstName: usr.firstName, lastName: usr.lastName, department: usr.department } : undefined,
      };
    });

    // Format DB transactions that may not be in in-memory store
    const dbList = transactions.map((t) => ({
      id: t.id,
      referenceNumber: t.referenceNumber || `SIV-${t.id.slice(0, 8)}`,
      inventoryItemId: t.inventoryItemId,
      inventoryItem: t.inventoryItem,
      quantity: Math.abs(t.quantity),
      warehouseId: t.warehouseId,
      status: 'ISSUED',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.createdAt.toISOString(),
      user: t.user,
    }));

    // Combine avoiding duplicates
    const seen = new Set(reqList.map((r) => r.id));
    const combined = [...reqList, ...dbList.filter((d) => !seen.has(d.id))];

    return combined;
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Create a new Requisition Request (Department Head, Staff, Admin)
 */
export const createRequisitionService = async (input: CreateRequisitionInput) => {
  const prisma = getPrisma();
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const warehouseId = input.warehouseId || item.warehouseId;
    const reqId = crypto.randomUUID();
    const reqNumber = input.requisitionNumber || `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: RequisitionRecord = {
      id: reqId,
      requisitionNumber: reqNumber,
      inventoryItemId: input.inventoryItemId,
      warehouseId,
      quantity: input.quantity,
      justification: input.justification || '',
      status: input.isApproved ? 'APPROVED' : 'PENDING',
      userId: input.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requisitionStore.set(reqId, record);

    return {
      id: record.id,
      referenceNumber: record.requisitionNumber,
      inventoryItemId: record.inventoryItemId,
      inventoryItem: { name: item.name, itemCode: item.itemCode },
      quantity: record.quantity,
      warehouseId: record.warehouseId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Approve a Requisition (Department Head, PAO, Admin)
 */
export const approveRequisitionService = async (reqId: string) => {
  const req = requisitionStore.get(reqId);
  if (!req) {
    // If not in store, create/approve stub
    const newRecord: RequisitionRecord = {
      id: reqId,
      requisitionNumber: `REQ-${reqId.slice(0, 8)}`,
      inventoryItemId: '',
      warehouseId: '',
      quantity: 1,
      justification: '',
      status: 'APPROVED',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requisitionStore.set(reqId, newRecord);
    return newRecord;
  }
  req.status = 'APPROVED';
  req.updatedAt = new Date().toISOString();
  return req;
};

/**
 * Reject a Requisition (Department Head, PAO, Admin)
 */
export const rejectRequisitionService = async (reqId: string, reason?: string) => {
  const req = requisitionStore.get(reqId);
  if (!req) {
    const newRecord: RequisitionRecord = {
      id: reqId,
      requisitionNumber: `REQ-${reqId.slice(0, 8)}`,
      inventoryItemId: '',
      warehouseId: '',
      quantity: 1,
      justification: '',
      status: 'REJECTED',
      rejectionReason: reason || 'Rejected by Department Head',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requisitionStore.set(reqId, newRecord);
    return newRecord;
  }
  req.status = 'REJECTED';
  req.rejectionReason = reason || 'Rejected by Department Head';
  req.updatedAt = new Date().toISOString();
  return req;
};

/**
 * Storekeeper Issues Stock — Executes FIFO cost layer consumption and updates ledger
 */
export const issueStock = async (input: IssueStockInput) => {
  const prisma = getPrisma();

  // If input missing itemId, lookup from store
  let targetItemId = input.inventoryItemId;
  let targetWarehouseId = input.warehouseId;
  let targetQty = input.quantity;

  const foundReq = Array.from(requisitionStore.values()).find(
    (r) => r.id === input.requisitionNumber || r.requisitionNumber === input.requisitionNumber
  );

  if (foundReq) {
    targetItemId = targetItemId || foundReq.inventoryItemId;
    targetWarehouseId = targetWarehouseId || foundReq.warehouseId;
    targetQty = targetQty || foundReq.quantity;
  }

  return prisma.$transaction(async (tx) => {
    let itemExists = targetItemId ? await tx.inventoryItem.findUnique({
      where: { id: targetItemId },
    }) : null;

    if (!itemExists) {
      // Fallback: pick first inventory item if none specified
      const firstItem = await tx.inventoryItem.findFirst();
      if (!firstItem) throw new AppError('No inventory items found in system', 404);
      itemExists = firstItem;
      targetItemId = firstItem.id;
    }

    targetWarehouseId = targetWarehouseId || itemExists.warehouseId;

    const activeLots = await tx.stockLot.findMany({
      where: {
        inventoryItemId: targetItemId,
        isDepleted: false,
        quantityRemaining: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });


    let fifoResult;
    try {
      fifoResult = applyFifoConsumption(activeLots, targetQty);
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw new AppError('Insufficient FIFO stock available in warehouse lots', 400);
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

    const sivNumber = `SIV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await tx.stockTransaction.create({
      data: {
        type: 'ISSUE',
        inventoryItemId: targetItemId,
        warehouseId: targetWarehouseId,
        quantity: targetQty,
        unitCost,
        totalValue: fifoResult.totalValue,
        referenceNumber: sivNumber,
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
          inventoryItemId: targetItemId,
          warehouseId: targetWarehouseId,
        },
      },
    });

    const currentBalance = existingBinCard ? existingBinCard.balance : 0;
    const newBalance = Math.max(0, currentBalance - targetQty);

    const binCard = await tx.binCard.upsert({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: targetItemId,
          warehouseId: targetWarehouseId,
        },
      },
      update: {
        balance: newBalance,
        lastUpdated: new Date(),
      },
      create: {
        inventoryItemId: targetItemId,
        warehouseId: targetWarehouseId,
        balance: newBalance,
      },
    });


    // Update in-memory record if exists
    for (const req of requisitionStore.values()) {
      if (req.requisitionNumber === input.requisitionNumber || req.id === input.requisitionNumber) {
        req.status = 'ISSUED';
        req.sivNumber = sivNumber;
        req.updatedAt = new Date().toISOString();
      }
    }

    return {
      id: transaction.id,
      referenceNumber: sivNumber,
      sivNumber,
      transaction,
      consumptions: fifoResult.consumptions,
      binCard,
    };
  });
};
