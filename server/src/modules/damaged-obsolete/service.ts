import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import { applyFifoConsumption, InsufficientStockError } from '../inventory/fifo.ts';

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

export interface CreateWriteOffInput {
  itemId: string;
  quantity: number;
  reasonCode: 'DAMAGED' | 'OBSOLETE' | 'EXPIRED' | 'OTHER';
  reasonDescription?: string;
  notes?: string;
}

interface WriteOffRecord {
  id: string;
  itemId: string;
  quantity: number;
  reasonCode: string;
  reasonDescription?: string | null;
  notes?: string | null;
  status: string;
  rejectionReason?: string | null;
  requestedBy: string;
  requestedAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  disposedBy?: string | null;
  disposedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  item?: { name: string } | null;
  requester?: { firstName: string; lastName: string } | null;
  approver?: { firstName: string; lastName: string } | null;
  rejecter?: { firstName: string; lastName: string } | null;
  disposer?: { firstName: string; lastName: string } | null;
}

const formatWriteOffResponse = (record: WriteOffRecord) => ({
  id: record.id,
  itemId: record.itemId,
  itemName: record.item?.name ?? 'Unknown Item',
  quantity: record.quantity,
  reasonCode: record.reasonCode,
  reasonDescription: record.reasonDescription ?? undefined,
  notes: record.notes ?? undefined,
  status: record.status,
  rejectionReason: record.rejectionReason ?? undefined,
  requestedBy: record.requester
    ? `${record.requester.firstName} ${record.requester.lastName}`.trim()
    : record.requestedBy,
  requestedAt: record.requestedAt
    ? new Date(record.requestedAt).toISOString()
    : record.createdAt?.toISOString?.() ?? new Date().toISOString(),
  approvedBy: record.approver
    ? `${record.approver.firstName} ${record.approver.lastName}`.trim()
    : record.approvedBy ?? undefined,
  approvedAt: record.approvedAt ? new Date(record.approvedAt).toISOString() : undefined,
  rejectedBy: record.rejecter
    ? `${record.rejecter.firstName} ${record.rejecter.lastName}`.trim()
    : record.rejectedBy ?? undefined,
  rejectedAt: record.rejectedAt ? new Date(record.rejectedAt).toISOString() : undefined,
  disposedBy: record.disposer
    ? `${record.disposer.firstName} ${record.disposer.lastName}`.trim()
    : record.disposedBy ?? undefined,
  disposedAt: record.disposedAt ? new Date(record.disposedAt).toISOString() : undefined,
  createdAt: record.createdAt?.toISOString?.() ?? new Date().toISOString(),
  updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
});

export const createWriteOff = async (input: CreateWriteOffInput, userId: string) => {
  const prisma = getPrisma();
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: input.itemId },
    });
    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const created = await prisma.writeOffRequest.create({
      data: {
        itemId: input.itemId,
        quantity: input.quantity,
        reasonCode: input.reasonCode,
        reasonDescription: input.reasonDescription,
        notes: input.notes,
        status: 'PENDING',
        requestedBy: userId,
      },
      include: {
        item: true,
        requester: true,
      },
    });

    return formatWriteOffResponse(created);
  } finally {
    await prisma.$disconnect();
  }
};

export const getWriteOffs = async (statusFilter?: string) => {
  const prisma = getPrisma();
  try {
    const where = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
    const records = await prisma.writeOffRequest.findMany({
      where,
      include: {
        item: true,
        requester: true,
        approver: true,
        rejecter: true,
        disposer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(formatWriteOffResponse);
  } finally {
    await prisma.$disconnect();
  }
};

export const getWriteOffById = async (id: string) => {
  const prisma = getPrisma();
  try {
    const record = await prisma.writeOffRequest.findUnique({
      where: { id },
      include: {
        item: true,
        requester: true,
        approver: true,
        rejecter: true,
        disposer: true,
      },
    });

    if (!record) {
      throw new AppError('Write-off request not found', 404);
    }

    return formatWriteOffResponse(record);
  } finally {
    await prisma.$disconnect();
  }
};

export const approveWriteOff = async (id: string, approverId: string) => {
  const prisma = getPrisma();
  try {
    const record = await prisma.writeOffRequest.findUnique({ where: { id } });
    if (!record) {
      throw new AppError('Write-off request not found', 404);
    }
    if (record.status !== 'PENDING') {
      throw new AppError(`Cannot approve write-off in ${record.status} status`, 400);
    }

    const updated = await prisma.writeOffRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: {
        item: true,
        requester: true,
        approver: true,
      },
    });

    return formatWriteOffResponse(updated);
  } finally {
    await prisma.$disconnect();
  }
};

export const rejectWriteOff = async (id: string, rejecterId: string, reason?: string) => {
  const prisma = getPrisma();
  try {
    const record = await prisma.writeOffRequest.findUnique({ where: { id } });
    if (!record) {
      throw new AppError('Write-off request not found', 404);
    }
    if (record.status !== 'PENDING') {
      throw new AppError(`Cannot reject write-off in ${record.status} status`, 400);
    }

    const updated = await prisma.writeOffRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: rejecterId,
        rejectedAt: new Date(),
        rejectionReason: reason ?? 'Write-off request rejected',
      },
      include: {
        item: true,
        requester: true,
        approver: true,
        rejecter: true,
      },
    });

    return formatWriteOffResponse(updated);
  } finally {
    await prisma.$disconnect();
  }
};

export const disposeWriteOff = async (id: string, disposerId: string) => {
  const prisma = getPrisma();
  try {
    return await prisma.$transaction(async (tx) => {
      const record = await tx.writeOffRequest.findUnique({
        where: { id },
        include: { item: true },
      });

      if (!record) {
        throw new AppError('Write-off request not found', 404);
      }
      if (record.status !== 'APPROVED') {
        throw new AppError('Only approved write-off requests can be disposed', 400);
      }

      const activeLots = await tx.stockLot.findMany({
        where: {
          inventoryItemId: record.itemId,
          isDepleted: false,
          quantityRemaining: { gt: 0 },
        },
        orderBy: { receivedDate: 'asc' },
      });

      let fifoResult;
      try {
        fifoResult = applyFifoConsumption(activeLots, record.quantity);
      } catch (err) {
        if (err instanceof InsufficientStockError) {
          throw new AppError('Insufficient stock available to complete disposal', 400);
        }
        throw err;
      }

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
          type: 'ADJUSTMENT',
          inventoryItemId: record.itemId,
          warehouseId: record.item.warehouseId,
          quantity: record.quantity,
          unitCost,
          totalValue: fifoResult.totalValue,
          referenceNumber: `DISPOSAL-${id}`,
          userId: disposerId,
        },
      });

      await tx.lotConsumption.createMany({
        data: fifoResult.consumptions.map((c) => ({
          stockLotId: c.stockLotId,
          stockTransactionId: txRecord.id,
          quantityConsumed: c.quantityConsumed,
        })),
      });

      const updated = await tx.writeOffRequest.update({
        where: { id },
        data: {
          status: 'DISPOSED',
          disposedBy: disposerId,
          disposedAt: new Date(),
        },
        include: {
          item: true,
          requester: true,
          approver: true,
          disposer: true,
        },
      });

      return formatWriteOffResponse(updated);
    });
  } finally {
    await prisma.$disconnect();
  }
};
