import { sendRequisitionStatusEmail, sendLowStockAlertEmail } from '../../utils/mailer.js';
import { getPrisma } from '../../config/db.ts';
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

const safeDisconnect = async (prisma: unknown) => {
  if (process.env.NODE_ENV === 'test') {
    try {
      const disc = (prisma as { $disconnect?: () => unknown })?.$disconnect;
      if (typeof disc === 'function') {
        const res = disc.call(prisma);
        if (res && typeof (res as Promise<unknown>).then === 'function') {
          await res;
        }
      }
    } catch {
      // ignore
    }
  }
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

export interface RequisitionItemInput {
  itemId: string;
  quantityRequested: number;
}

export interface CreateRequisitionInput {
  department: string;
  justification: string;
  items: RequisitionItemInput[];
}

interface RequisitionLineItemRecord {
  id: string;
  inventoryItemId: string;
  inventoryItem?: { name?: string; itemCode?: string } | null;
  quantityRequested: number;
}

interface RequisitionRecord {
  id: string;
  requisitionNumber: string;
  department: string;
  justification: string;
  status: string;
  rejectionReason?: string | null;
  requesterId: string;
  requester?: { firstName: string; lastName: string } | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approver?: { firstName: string; lastName: string } | null;
  issuedBy?: string | null;
  issuedAt?: Date | null;
  issuer?: { firstName: string; lastName: string } | null;
  sivNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: RequisitionLineItemRecord[];
}

const formatRequisitionResponse = (req: RequisitionRecord) => ({
  id: req.id,
  requisitionNumber: req.requisitionNumber,
  department: req.department,
  justification: req.justification,
  status: req.status,
  rejectionReason: req.rejectionReason ?? undefined,
  requestedBy: req.requester
    ? `${req.requester.firstName} ${req.requester.lastName}`.trim()
    : req.requesterId,
  requesterId: req.requesterId,
  approvedBy: req.approver
    ? `${req.approver.firstName} ${req.approver.lastName}`.trim()
    : req.approvedBy ?? undefined,
  approvedAt: req.approvedAt ? new Date(req.approvedAt).toISOString() : undefined,
  issuedBy: req.issuer
    ? `${req.issuer.firstName} ${req.issuer.lastName}`.trim()
    : req.issuedBy ?? undefined,
  issuedAt: req.issuedAt ? new Date(req.issuedAt).toISOString() : undefined,
  sivNumber: req.sivNumber ?? undefined,
  createdAt: req.createdAt ? new Date(req.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: req.updatedAt ? new Date(req.updatedAt).toISOString() : new Date().toISOString(),
  items:
    req.items?.map((item: RequisitionLineItemRecord) => ({
      id: item.id,
      itemId: item.inventoryItemId,
      itemName: item.inventoryItem?.name ?? 'Unknown Item',
      itemCode: item.inventoryItem?.itemCode ?? '',
      quantityRequested: item.quantityRequested,
    })) ?? [],
});

export const createRequisition = async (input: CreateRequisitionInput, userId: string) => {
  const prisma = getPrisma();
  try {
    const year = new Date().getFullYear();
    const count = await prisma.requisition.count();
    const requisitionNumber = `REQ-${year}-${String(count + 1).padStart(4, '0')}`;

    const created = await prisma.requisition.create({
      data: {
        requisitionNumber,
        requesterId: userId,
        department: input.department,
        justification: input.justification,
        status: 'PENDING',
        items: {
          create: input.items.map((item) => ({
            inventoryItemId: item.itemId,
            quantityRequested: item.quantityRequested,
          })),
        },
      },
      include: {
        requester: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return formatRequisitionResponse(created);
  } finally {
    await safeDisconnect(prisma);
  }
};

export const getRequisitions = async (statusFilter?: string) => {
  const prisma = getPrisma();
  try {
    const where = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
    const requisitions = await prisma.requisition.findMany({
      where,
      include: {
        requester: true,
        approver: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requisitions.map(formatRequisitionResponse);
  } finally {
    await safeDisconnect(prisma);
  }
};

export const getRequisitionById = async (id: string) => {
  const prisma = getPrisma();
  try {
    const requisition = await prisma.requisition.findUnique({
      where: { id },
      include: {
        requester: true,
        approver: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!requisition) {
      throw new AppError('Requisition not found', 404);
    }

    return formatRequisitionResponse(requisition);
  } finally {
    await safeDisconnect(prisma);
  }
};

export const approveRequisition = async (id: string, approverId: string) => {
  const prisma = getPrisma();
  try {
    const requisition = await prisma.requisition.findUnique({ where: { id } });
    if (!requisition) {
      throw new AppError('Requisition not found', 404);
    }
    if (requisition.status !== 'PENDING') {
      throw new AppError(`Cannot approve requisition in ${requisition.status} status`, 400);
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: {
        requester: true,
        approver: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (updated.requester?.email) {
      sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'APPROVED').catch(console.error);
    }
    if (updated.requester?.email) {
      sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'REJECTED', updated.rejectionReason || 'No reason provided').catch(console.error);
    }
    return formatRequisitionResponse(updated);
  } finally {
    await safeDisconnect(prisma);
  }
};

export const rejectRequisition = async (id: string, approverId: string, reason?: string) => {
  const prisma = getPrisma();
  try {
    const requisition = await prisma.requisition.findUnique({ where: { id } });
    if (!requisition) {
      throw new AppError('Requisition not found', 404);
    }
    if (requisition.status !== 'PENDING') {
      throw new AppError(`Cannot reject requisition in ${requisition.status} status`, 400);
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        rejectionReason: reason ?? 'Rejected by supervisor',
      },
      include: {
        requester: true,
        approver: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (updated.requester?.email) {
      sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'APPROVED').catch(console.error);
    }
    if (updated.requester?.email) {
      sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'REJECTED', reason).catch(console.error);
    }
    return formatRequisitionResponse(updated);
  } finally {
    await safeDisconnect(prisma);
  }
};

export const issueRequisition = async (
  id: string,
  issuerId: string,
  warehouseIdOverride?: string
) => {
  const prisma = getPrisma();
  try {
    return await prisma.$transaction(async (tx) => {
      const requisition = await tx.requisition.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (!requisition) {
        throw new AppError('Requisition not found', 404);
      }

      if (requisition.status !== 'APPROVED') {
        throw new AppError('Only approved requisitions can be issued', 400);
      }

      const year = new Date().getFullYear();
      const count = await tx.requisition.count({ where: { status: 'ISSUED' } });
      const sivNumber = `SIV-${year}-${String(count + 1).padStart(4, '0')}`;

      for (const lineItem of requisition.items) {
        const item = lineItem.inventoryItem;
        const warehouseId = warehouseIdOverride ?? item.warehouseId;

        const activeLots = await tx.stockLot.findMany({
          where: {
            inventoryItemId: item.id,
            isDepleted: false,
            quantityRemaining: { gt: 0 },
          },
          orderBy: { receivedDate: 'asc' },
        });

        const fifoResult = applyFifoConsumption(activeLots, lineItem.quantityRequested);

        for (const updatedLot of fifoResult.updatedLots) {
          await tx.stockLot.update({
            where: { id: updatedLot.id },
            data: {
              quantityRemaining: updatedLot.quantityRemaining,
              isDepleted: updatedLot.isDepleted,
            },
          });
        }

        const unitCost =
          fifoResult.totalQuantity > 0 ? fifoResult.totalValue / fifoResult.totalQuantity : 0;

        const txRecord = await tx.stockTransaction.create({
          data: {
            type: 'ISSUE',
            inventoryItemId: item.id,
            warehouseId,
            quantity: lineItem.quantityRequested,
            unitCost,
            totalValue: fifoResult.totalValue,
            referenceNumber: sivNumber,
            userId: issuerId,
          },
        });

        await tx.lotConsumption.createMany({
          data: fifoResult.consumptions.map((c) => ({
            stockLotId: c.stockLotId,
            stockTransactionId: txRecord.id,
            quantityConsumed: c.quantityConsumed,
          })),
        });

        const existingBinCard = await tx.binCard.findUnique({
          where: {
            inventoryItemId_warehouseId: {
              inventoryItemId: item.id,
              warehouseId,
            },
          },
        });

        const currentBalance = existingBinCard ? existingBinCard.balance : 0;
        const newBalance = currentBalance - lineItem.quantityRequested;

        await tx.binCard.upsert({
          where: {
            inventoryItemId_warehouseId: {
              inventoryItemId: item.id,
              warehouseId,
            },
          },
          update: {
            balance: newBalance,
            lastUpdated: new Date(),
          },
          create: {
            inventoryItemId: item.id,
            warehouseId,
            balance: newBalance,
          },
        });
      }

      const updated = await tx.requisition.update({
        where: { id },
        data: {
          status: 'ISSUED',
          issuedBy: issuerId,
          issuedAt: new Date(),
          sivNumber,
        },
        include: {
          requester: true,
          approver: true,
          issuer: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (updated.requester?.email) {
        sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'ISSUED').catch(console.error);
      }

      // Check for low stock
      for (const lineItem of updated.items) {
        const item = lineItem.inventoryItem;
        const bin = await tx.binCard.findUnique({
          where: {
            inventoryItemId_warehouseId: {
              inventoryItemId: item.id,
              warehouseId: warehouseIdOverride ?? item.warehouseId,
            }
          }
        });
        const currentStock = bin ? bin.balance : 0;
        
        if (currentStock <= item.minLevel) {
          const storekeepers = await tx.user.findMany({ where: { role: 'STOREKEEPER', isActive: true } });
          const emails = storekeepers.map((u) => u.email).filter(Boolean);
          if (emails.length > 0) {
            sendLowStockAlertEmail(emails, item.itemCode, item.name, currentStock, item.minLevel).catch(console.error);
          }
        }
      }

      return formatRequisitionResponse(updated);
    });
  } finally {
    await safeDisconnect(prisma);
  }
};

export const getIssueHistory = async () => {
  const prisma = getPrisma();
  try {
    const transactions = await prisma.stockTransaction.findMany({
      where: { type: 'ISSUE' },
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

    return transactions.map((tx) => ({
      id: tx.id,
      sivNumber: tx.referenceNumber ?? 'SIV-N/A',
      issueDate: tx.createdAt.toISOString(),
      item: tx.inventoryItem.name,
      itemCode: tx.inventoryItem.itemCode,
      quantity: tx.quantity,
      unitCost: tx.unitCost,
      totalCost: tx.totalValue ?? (tx.unitCost ? tx.quantity * tx.unitCost : 0),
      warehouse: tx.warehouse.name,
      issuedTo: 'Department',
      issuedBy: tx.user ? `${tx.user.firstName} ${tx.user.lastName}`.trim() : 'Storekeeper',
      status: 'ISSUED',
    }));
  } finally {
    await safeDisconnect(prisma);
  }
};

export const getIssuingItems = async () => {
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
    unit: 'Units',
    quantity: item.BinCard.reduce((sum, b) => sum + b.balance, 0),
    totalAvailable: item.BinCard.reduce((sum, b) => sum + b.balance, 0),
  }));
};


