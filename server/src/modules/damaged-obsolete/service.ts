import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type WriteOffReason, type WriteOffStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import { createAuditLog } from '../audit-log/service.ts';

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

export interface CreateWriteOffInput {
  itemId: string;
  quantity: number;
  reasonCode: WriteOffReason;
  reasonDescription?: string;
  notes?: string;
}

export const createWriteOff = async (
  input: CreateWriteOffInput,
  userId: string
) => {
  const prisma = createPrismaClient();

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: input.itemId },
    });

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const writeOff = await prisma.writeOffRequest.create({
      data: {
        inventoryItemId: input.itemId,
        warehouseId: item.warehouseId,
        quantity: input.quantity,
        reasonCode: input.reasonCode,
        reasonDescription: input.reasonDescription,
        notes: input.notes,
        status: 'PENDING',
        requestedBy: userId,
      },
      include: {
        inventoryItem: true,
        warehouse: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId,
      action: 'WRITE_OFF_REQUESTED',
      entity: 'WriteOffRequest',
      entityId: writeOff.id,
      details: {
        itemId: input.itemId,
        quantity: input.quantity,
        reasonCode: input.reasonCode,
      },
    });

    return writeOff;
  } finally {
    await prisma.$disconnect();
  }
};

export const getWriteOffs = async (status?: WriteOffStatus) => {
  const prisma = createPrismaClient();

  try {
    const list = await prisma.writeOffRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        inventoryItem: true,
        warehouse: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        rejector: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        disposer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list;
  } finally {
    await prisma.$disconnect();
  }
};

export const getWriteOffById = async (id: string) => {
  const prisma = createPrismaClient();

  try {
    const writeOff = await prisma.writeOffRequest.findUnique({
      where: { id },
      include: {
        inventoryItem: true,
        warehouse: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        rejector: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        disposer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!writeOff) {
      throw new AppError('Write-off request not found', 404);
    }

    return writeOff;
  } finally {
    await prisma.$disconnect();
  }
};

export const approveWriteOff = async (id: string, userId: string) => {
  const prisma = createPrismaClient();

  try {
    const existing = await prisma.writeOffRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Write-off request not found', 404);
    }

    if (existing.status !== 'PENDING') {
      throw new AppError(
        `Cannot approve write-off request with status ${existing.status}`,
        400
      );
    }

    const updated = await prisma.writeOffRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        inventoryItem: true,
        warehouse: true,
      },
    });

    await createAuditLog({
      userId,
      action: 'WRITE_OFF_APPROVED',
      entity: 'WriteOffRequest',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: 'APPROVED' },
    });

    return updated;
  } finally {
    await prisma.$disconnect();
  }
};

export const rejectWriteOff = async (
  id: string,
  userId: string,
  reason?: string
) => {
  const prisma = createPrismaClient();

  try {
    const existing = await prisma.writeOffRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Write-off request not found', 404);
    }

    if (existing.status !== 'PENDING') {
      throw new AppError(
        `Cannot reject write-off request with status ${existing.status}`,
        400
      );
    }

    const updated = await prisma.writeOffRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        inventoryItem: true,
        warehouse: true,
      },
    });

    await createAuditLog({
      userId,
      action: 'WRITE_OFF_REJECTED',
      entity: 'WriteOffRequest',
      entityId: id,
      details: { reason },
    });

    return updated;
  } finally {
    await prisma.$disconnect();
  }
};

export const disposeWriteOff = async (id: string, userId: string) => {
  const prisma = createPrismaClient();

  try {
    const existing = await prisma.writeOffRequest.findUnique({
      where: { id },
      include: { inventoryItem: true },
    });

    if (!existing) {
      throw new AppError('Write-off request not found', 404);
    }

    if (existing.status !== 'APPROVED' && existing.status !== 'PENDING') {
      throw new AppError(
        `Cannot dispose write-off request with status ${existing.status}`,
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update write off request
      const updatedWriteOff = await tx.writeOffRequest.update({
        where: { id },
        data: {
          status: 'DISPOSED',
          disposedBy: userId,
          disposedAt: new Date(),
        },
        include: {
          inventoryItem: true,
          warehouse: true,
        },
      });

      // 2. Map reasonCode to ItemState
      const itemStateMap: Record<string, 'DAMAGED' | 'OBSOLETE' | 'DISPOSED'> = {
        DAMAGED: 'DAMAGED',
        OBSOLETE: 'OBSOLETE',
        EXPIRED: 'DISPOSED',
        OTHER: 'DISPOSED',
      };
      const newState = itemStateMap[existing.reasonCode] || 'DISPOSED';

      await tx.inventoryItem.update({
        where: { id: existing.inventoryItemId },
        data: { state: newState },
      });

      // 3. Decrement BinCard
      const binCard = await tx.binCard.findUnique({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: existing.inventoryItemId,
            warehouseId: existing.warehouseId,
          },
        },
      });

      if (binCard) {
        const newBalance = Math.max(0, binCard.balance - existing.quantity);
        await tx.binCard.update({
          where: { id: binCard.id },
          data: {
            balance: newBalance,
            lastUpdated: new Date(),
          },
        });
      }

      // 4. Create StockTransaction (ADJUSTMENT)
      await tx.stockTransaction.create({
        data: {
          type: 'ADJUSTMENT',
          inventoryItemId: existing.inventoryItemId,
          warehouseId: existing.warehouseId,
          quantity: -existing.quantity,
          referenceNumber: `WRITE-OFF-${existing.id.substring(0, 8)}`,
          userId,
        },
      });

      return updatedWriteOff;
    });

    await createAuditLog({
      userId,
      action: 'WRITE_OFF_DISPOSED',
      entity: 'WriteOffRequest',
      entityId: id,
      details: {
        quantityDisposed: existing.quantity,
        inventoryItemId: existing.inventoryItemId,
      },
    });

    return result;
  } finally {
    await prisma.$disconnect();
  }
};
