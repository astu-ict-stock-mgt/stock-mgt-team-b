import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

// ---------- Types ----------

interface ReceivingItemInput {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
}

export interface CreateReceivingInput {
  supplierId: string;
  warehouseId: string;
  receivedDate?: string;
  items: ReceivingItemInput[];
}

export interface InspectionItemInput {
  itemId: string;
  acceptedQty: number;
  damagedQty: number;
  inspectorRemarks?: string;
}

// ---------- DB helper ----------

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new AppError('DATABASE_URL must be configured', 500);
  return databaseUrl;
};

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });

// ---------- Service functions ----------

/** Stage 1: Storekeeper creates a DRAFT receiving note */
export const createReceiving = async (
  input: CreateReceivingInput,
  receivedBy: string
) => {
  const prisma = createPrismaClient();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
      if (!supplier) throw new AppError('Supplier not found', 404);
      if (supplier.isActive === false) throw new AppError('Supplier is inactive', 400);

      const warehouse = await tx.warehouse.findUnique({ where: { id: input.warehouseId } });
      if (!warehouse) throw new AppError('Warehouse not found', 404);

      const user = await tx.user.findUnique({ where: { id: receivedBy } });
      if (!user) throw new AppError('Receiving user not found', 404);

      for (const item of input.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });
        if (!inventoryItem) {
          throw new AppError(`Inventory item not found: ${item.inventoryItemId}`, 404);
        }
      }

      const year = new Date(input.receivedDate ?? new Date().toISOString()).getFullYear();
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
          receivedDate: input.receivedDate ? new Date(input.receivedDate) : new Date(),
          receivedBy,
          status: 'DRAFT',
          items: {
            create: input.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              inspectionStatus: 'ACCEPTED' as const,
            })),
          },
        },
        include: { items: true },
      });

      return grn;
    });

    return result;
  } finally {
    await prisma.$disconnect();
  }
};

/** Stage 2: Storekeeper sends DRAFT → PENDING_INSPECTION */
export const sendToInspection = async (grnId: string, _userId: string) => {
  const prisma = createPrismaClient();
  try {
    const grn = await prisma.goodsReceivingNote.findUnique({ where: { id: grnId } });
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'DRAFT') {
      throw new AppError(`Cannot send to inspection: GRN is in status "${grn.status}"`, 400);
    }

    return await prisma.goodsReceivingNote.update({
      where: { id: grnId },
      data: { status: 'PENDING_INSPECTION' },
      include: { items: { include: { inventoryItem: true } }, supplier: true, warehouse: true },
    });
  } finally {
    await prisma.$disconnect();
  }
};

/** Stage 3: Inspector (Stock Clerk) submits inspection results */
export const submitInspectionReport = async (
  grnId: string,
  items: InspectionItemInput[],
  inspectorNotes: string | undefined,
  inspectedBy: string
) => {
  const prisma = createPrismaClient();
  try {
    const grn = await prisma.goodsReceivingNote.findUnique({
      where: { id: grnId },
      include: { items: true },
    });
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'PENDING_INSPECTION') {
      throw new AppError(`Cannot inspect: GRN is in status "${grn.status}"`, 400);
    }

    // Validate quantities per item
    for (const inspection of items) {
      const grnItem = grn.items.find((i) => i.id === inspection.itemId);
      if (!grnItem) throw new AppError(`Item ${inspection.itemId} not found in GRN`, 400);
      if (inspection.acceptedQty + inspection.damagedQty > grnItem.quantity) {
        throw new AppError(
          `Accepted + damaged qty exceeds received qty for item ${inspection.itemId}`,
          400
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Update each item with inspection results
      for (const inspection of items) {
        await tx.goodsReceivingNoteItem.update({
          where: { id: inspection.itemId },
          data: {
            acceptedQty: inspection.acceptedQty,
            damagedQty: inspection.damagedQty,
            inspectorRemarks: inspection.inspectorRemarks,
            inspectionStatus: inspection.acceptedQty > 0 ? 'ACCEPTED' : 'REJECTED',
          },
        });
      }

      return tx.goodsReceivingNote.update({
        where: { id: grnId },
        data: {
          status: 'INSPECTED',
          inspectedBy,
          inspectedAt: new Date(),
          inspectorNotes: inspectorNotes?.trim() || null,
        },
        include: {
          items: { include: { inventoryItem: true } },
          supplier: true,
          warehouse: true,
        },
      });
    });
  } finally {
    await prisma.$disconnect();
  }
};

/** Stage 4: Storekeeper reviews inspection report and confirms routing → PENDING_PAO_APPROVAL */
export const confirmRouting = async (grnId: string, _storekeeperId: string) => {
  const prisma = createPrismaClient();
  try {
    const grn = await prisma.goodsReceivingNote.findUnique({ where: { id: grnId } });
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'INSPECTED') {
      throw new AppError(`Cannot confirm routing: GRN is in status "${grn.status}"`, 400);
    }

    return await prisma.goodsReceivingNote.update({
      where: { id: grnId },
      data: { status: 'PENDING_PAO_APPROVAL' },
      include: {
        items: { include: { inventoryItem: true } },
        supplier: true,
        warehouse: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
};

/** Stage 5a: PAO Approves — commits stock lots, BinCards, transactions */
export const paoApprove = async (grnId: string, paoId: string) => {
  const prisma = createPrismaClient();
  try {
    const grn = await prisma.goodsReceivingNote.findUnique({
      where: { id: grnId },
      include: { items: { include: { inventoryItem: true } }, warehouse: true },
    });
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'PENDING_PAO_APPROVAL') {
      throw new AppError(`Cannot approve: GRN is in status "${grn.status}"`, 400);
    }

    // Find or create "Damaged Store" warehouse
    let damagedWarehouse = await prisma.warehouse.findFirst({
      where: { name: { contains: 'Damaged', mode: 'insensitive' } },
    });
    if (!damagedWarehouse) {
      damagedWarehouse = await prisma.warehouse.create({
        data: {
          name: 'Damaged Store',
          location: 'Quarantine Area — Restricted Access',
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of grn.items) {
        const acceptedQty = item.acceptedQty ?? item.quantity; // fallback to full qty if inspector didn't specify
        const damagedQty = item.damagedQty ?? 0;

        // ── Good items → main warehouse ──────────────────────────────────
        if (acceptedQty > 0) {
          await tx.stockLot.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              quantityReceived: acceptedQty,
              quantityRemaining: acceptedQty,
              unitCost: item.unitCost,
              receivedDate: grn.receivedDate,
            },
          });

          await tx.stockTransaction.create({
            data: {
              type: 'RECEIVE',
              inventoryItemId: item.inventoryItemId,
              warehouseId: grn.warehouseId,
              quantity: acceptedQty,
              unitCost: item.unitCost,
              totalValue: acceptedQty * item.unitCost,
              receivedDate: grn.receivedDate,
              referenceNumber: grn.grnNumber,
              supplierId: grn.supplierId,
              userId: paoId,
            },
          });

          // BinCard for the target (good) warehouse
          const existingBin = await tx.binCard.findUnique({
            where: {
              inventoryItemId_warehouseId: {
                inventoryItemId: item.inventoryItemId,
                warehouseId: grn.warehouseId,
              },
            },
          });
          if (existingBin) {
            await tx.binCard.update({
              where: { id: existingBin.id },
              data: { balance: { increment: acceptedQty }, lastUpdated: new Date() },
            });
          } else {
            await tx.binCard.create({
              data: {
                inventoryItemId: item.inventoryItemId,
                warehouseId: grn.warehouseId,
                balance: acceptedQty,
                lastUpdated: new Date(),
              },
            });
          }

          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { state: 'AVAILABLE' },
          });
        }

        // ── Damaged items → Damaged Store ────────────────────────────────
        if (damagedQty > 0) {
          await tx.stockTransaction.create({
            data: {
              type: 'TRANSFER',
              inventoryItemId: item.inventoryItemId,
              warehouseId: damagedWarehouse!.id,
              quantity: damagedQty,
              unitCost: item.unitCost,
              totalValue: damagedQty * item.unitCost,
              receivedDate: grn.receivedDate,
              referenceNumber: `DMG-${grn.grnNumber}`,
              supplierId: grn.supplierId,
              userId: paoId,
            },
          });

          // BinCard for the damaged warehouse
          const existingDamagedBin = await tx.binCard.findUnique({
            where: {
              inventoryItemId_warehouseId: {
                inventoryItemId: item.inventoryItemId,
                warehouseId: damagedWarehouse!.id,
              },
            },
          });
          if (existingDamagedBin) {
            await tx.binCard.update({
              where: { id: existingDamagedBin.id },
              data: { balance: { increment: damagedQty }, lastUpdated: new Date() },
            });
          } else {
            await tx.binCard.create({
              data: {
                inventoryItemId: item.inventoryItemId,
                warehouseId: damagedWarehouse!.id,
                balance: damagedQty,
                lastUpdated: new Date(),
              },
            });
          }
        }
      }

      // Mark GRN as APPROVED
      await tx.goodsReceivingNote.update({
        where: { id: grnId },
        data: {
          status: 'APPROVED',
          approvedBy: paoId,
          approvedAt: new Date(),
        },
      });
    });

    return prisma.goodsReceivingNote.findUnique({
      where: { id: grnId },
      include: {
        items: { include: { inventoryItem: true } },
        supplier: true,
        warehouse: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
};

/** Stage 5b: PAO Rejects */
export const paoReject = async (grnId: string, paoId: string, reason: string) => {
  const prisma = createPrismaClient();
  try {
    const grn = await prisma.goodsReceivingNote.findUnique({ where: { id: grnId } });
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'PENDING_PAO_APPROVAL') {
      throw new AppError(`Cannot reject: GRN is in status "${grn.status}"`, 400);
    }

    return await prisma.goodsReceivingNote.update({
      where: { id: grnId },
      data: {
        status: 'REJECTED',
        rejectedBy: paoId,
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
      },
      include: {
        items: { include: { inventoryItem: true } },
        supplier: true,
        warehouse: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
};

// ---------- Read helpers ----------

export const getReceivingNotes = async (statusFilter?: string) => {
  const prisma = createPrismaClient();
  try {
    return await prisma.goodsReceivingNote.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        supplier: true,
        warehouse: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { inventoryItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getReceivingNoteById = async (id: string) => {
  const prisma = createPrismaClient();
  try {
    const note = await prisma.goodsReceivingNote.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { inventoryItem: true } },
      },
    });
    if (!note) throw new AppError('Goods Receiving Note not found', 404);
    return note;
  } finally {
    await prisma.$disconnect();
  }
};
