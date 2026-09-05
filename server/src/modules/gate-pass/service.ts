import { getPrisma } from '../../config/db.ts';
import { AppError } from '../../middlewares/errorHandler.ts';
import type { Prisma } from '../../generated/prisma/client.js';

const safeDisconnect = async (prisma: ReturnType<typeof getPrisma>) => {
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  if (isTest) {
    await prisma.$disconnect();
  }
};

export interface GatePassItemSummary {
  itemCode: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface PendingOutboundDispatch {
  id: string;
  referenceType: 'SIV' | 'TRANSFER';
  referenceNumber: string;
  issuedAt: Date | string;
  issuedBy: string;
  departmentOrDestination: string;
  warehouseName: string;
  itemsCount: number;
  items: GatePassItemSummary[];
  status: 'READY_FOR_EXIT' | 'CLEARED' | 'FLAGGED';
  gatePassNumber: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  clearedAt: Date | string | null;
}

export interface PendingInboundDelivery {
  id: string;
  grnNumber: string;
  supplierName: string;
  warehouseName: string;
  receivedDate: Date | string;
  receivedBy: string;
  itemsCount: number;
  items: GatePassItemSummary[];
  status: 'READY_FOR_ENTRY' | 'CLEARED' | 'FLAGGED';
  gatePassNumber: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  clearedAt: Date | string | null;
}

export interface ClearOutboundInput {
  referenceNumber: string;
  referenceType?: 'SIV' | 'TRANSFER';
  vehiclePlate: string;
  driverName: string;
  destination: string;
  remarks?: string;
  sealIntact?: boolean;
}

export interface ClearInboundInput {
  referenceNumber: string; // GRN number or Delivery Note
  supplierName?: string;
  vehiclePlate: string;
  driverName: string;
  remarks?: string;
  sealIntact?: boolean;
}

export interface FlagDiscrepancyInput {
  referenceNumber: string;
  referenceType: 'SIV' | 'TRANSFER' | 'GRN';
  reason: string;
  vehiclePlate?: string;
  driverName?: string;
  remarks?: string;
}

export interface GatePassRecord {
  id: string;
  passNumber: string;
  direction: 'OUTBOUND' | 'INBOUND';
  referenceType: 'SIV' | 'TRANSFER' | 'GRN';
  referenceNumber: string;
  vehiclePlate: string;
  driverName: string;
  destination?: string | null;
  origin?: string | null;
  status: 'CLEARED' | 'FLAGGED';
  remarks?: string | null;
  itemsCount: number;
  items: GatePassItemSummary[];
  officer: {
    id: string;
    name: string;
    email: string;
  };
  clearedAt: string;
}

/**
 * Lists all issued SIVs and Transfers awaiting exit clearance at the security gate
 */
export const getPendingOutboundDispatches = async (): Promise<PendingOutboundDispatch[]> => {
  const prisma = getPrisma();
  try {
    // 1. Fetch issued requisitions (SIVs)
    const issuedRequisitions = await prisma.requisition.findMany({
      where: {
        status: 'ISSUED',
      },
      include: {
        requester: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 2. Fetch recent outbound clearances from AuditLog
    const clearanceLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'GatePass',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    // Map clearances by referenceNumber
    const clearanceMap = new Map<string, Record<string, unknown>>();
    for (const log of clearanceLogs) {
      const details = (log.details as Record<string, unknown>) || {};
      const ref = (details.referenceNumber as string) || log.entityId;
      if (ref && !clearanceMap.has(ref)) {
        clearanceMap.set(ref, {
          ...details,
          logId: log.id,
          action: log.action,
          createdAt: log.createdAt,
        });
      }
    }

    const dispatches: PendingOutboundDispatch[] = [];

    for (const req of issuedRequisitions) {
      const siv = req.sivNumber || req.requisitionNumber;
      const clearance = clearanceMap.get(siv);

      const items: GatePassItemSummary[] = req.items.map((item) => ({
        itemCode: item.inventoryItem.itemCode,
        name: item.inventoryItem.name,
        quantity: item.quantityRequested,
      }));

      const warehouseName = req.items[0]?.inventoryItem.warehouse.name || 'Central Store';
      const isCleared = clearance?.action === 'GATE_PASS_EXIT_CLEARED';
      const isFlagged = clearance?.action === 'GATE_PASS_FLAGGED';

      dispatches.push({
        id: req.id,
        referenceType: 'SIV',
        referenceNumber: siv,
        issuedAt: req.issuedAt || req.updatedAt,
        issuedBy: req.issuer ? `${req.issuer.firstName} ${req.issuer.lastName}` : 'Storekeeper',
        departmentOrDestination: req.department,
        warehouseName,
        itemsCount: items.length,
        items,
        status: isCleared ? 'CLEARED' : isFlagged ? 'FLAGGED' : 'READY_FOR_EXIT',
        gatePassNumber: (clearance?.passNumber as string) || null,
        vehiclePlate: (clearance?.vehiclePlate as string) || null,
        driverName: (clearance?.driverName as string) || null,
        clearedAt: clearance ? new Date(clearance.createdAt as string | Date) : null,
      });
    }

    return dispatches;
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Lists incoming goods receiving notes (GRNs) awaiting gate entrance clearance
 */
export const getPendingInboundDeliveries = async (): Promise<PendingInboundDelivery[]> => {
  const prisma = getPrisma();
  try {
    const grns = await prisma.goodsReceivingNote.findMany({
      include: {
        supplier: true,
        warehouse: true,
        user: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        receivedDate: 'desc',
      },
      take: 50,
    });

    const clearanceLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'GatePass',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    const clearanceMap = new Map<string, Record<string, unknown>>();
    for (const log of clearanceLogs) {
      const details = (log.details as Record<string, unknown>) || {};
      const ref = (details.referenceNumber as string) || log.entityId;
      if (ref && !clearanceMap.has(ref)) {
        clearanceMap.set(ref, {
          ...details,
          logId: log.id,
          action: log.action,
          createdAt: log.createdAt,
        });
      }
    }

    return grns.map((grn) => {
      const clearance = clearanceMap.get(grn.grnNumber);
      const isCleared = clearance?.action === 'GATE_PASS_ENTRY_CLEARED';
      const isFlagged = clearance?.action === 'GATE_PASS_FLAGGED';

      const items: GatePassItemSummary[] = grn.items.map((i) => ({
        itemCode: i.inventoryItem.itemCode,
        name: i.inventoryItem.name,
        quantity: i.quantity,
      }));

      return {
        id: grn.id,
        grnNumber: grn.grnNumber,
        supplierName: grn.supplier?.name || 'Authorized Supplier',
        warehouseName: grn.warehouse?.name || 'Main Warehouse',
        receivedDate: grn.receivedDate,
        receivedBy: grn.user ? `${grn.user.firstName} ${grn.user.lastName}` : 'Receiving Clerk',
        itemsCount: items.length,
        items,
        status: isCleared ? 'CLEARED' : isFlagged ? 'FLAGGED' : 'READY_FOR_ENTRY',
        gatePassNumber: (clearance?.passNumber as string) || null,
        vehiclePlate: (clearance?.vehiclePlate as string) || null,
        driverName: (clearance?.driverName as string) || null,
        clearedAt: clearance ? new Date(clearance.createdAt as string | Date) : null,
      };
    });
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Records outbound exit clearance and issues an official Gate Pass
 */
export const clearOutboundGatePass = async (
  input: ClearOutboundInput,
  officerId: string
): Promise<GatePassRecord> => {
  const prisma = getPrisma();
  try {
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new AppError('Security officer record not found', 404);
    }

    // Lookup SIV or items
    let itemsSummary: GatePassItemSummary[] = [];
    let originWarehouse = 'Central Store';

    const requisition = await prisma.requisition.findFirst({
      where: {
        OR: [
          { sivNumber: input.referenceNumber },
          { requisitionNumber: input.referenceNumber },
        ],
      },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: { warehouse: true },
            },
          },
        },
      },
    });

    if (requisition) {
      itemsSummary = requisition.items.map((i) => ({
        itemCode: i.inventoryItem.itemCode,
        name: i.inventoryItem.name,
        quantity: i.quantityRequested,
      }));
      if (requisition.items[0]?.inventoryItem.warehouse.name) {
        originWarehouse = requisition.items[0].inventoryItem.warehouse.name;
      }
    }

    const year = new Date().getFullYear();
    const count = await prisma.auditLog.count({
      where: {
        entity: 'GatePass',
      },
    });
    const passNumber = `GP-${year}-${String(count + 1).padStart(4, '0')}`;
    const clearedAt = new Date().toISOString();

    const details = {
      passNumber,
      direction: 'OUTBOUND' as const,
      referenceType: input.referenceType || 'SIV',
      referenceNumber: input.referenceNumber,
      vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
      driverName: input.driverName.trim(),
      destination: input.destination.trim(),
      origin: originWarehouse,
      remarks: input.remarks || null,
      sealIntact: input.sealIntact ?? true,
      itemsCount: itemsSummary.length,
      items: itemsSummary,
      officer: {
        id: officer.id,
        name: `${officer.firstName} ${officer.lastName}`,
        email: officer.email,
      },
      clearedAt,
      status: 'CLEARED' as const,
    };

    const audit = await prisma.auditLog.create({
      data: {
        userId: officer.id,
        action: 'GATE_PASS_EXIT_CLEARED',
        entity: 'GatePass',
        entityId: passNumber,
        details: details as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: audit.id,
      ...details,
    };
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Records inbound entry clearance for incoming delivery
 */
export const clearInboundGatePass = async (
  input: ClearInboundInput,
  officerId: string
): Promise<GatePassRecord> => {
  const prisma = getPrisma();
  try {
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new AppError('Security officer record not found', 404);
    }

    const grn = await prisma.goodsReceivingNote.findFirst({
      where: {
        grnNumber: input.referenceNumber,
      },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    const itemsSummary: GatePassItemSummary[] =
      grn?.items.map((i) => ({
        itemCode: i.inventoryItem.itemCode,
        name: i.inventoryItem.name,
        quantity: i.quantity,
      })) || [];

    const year = new Date().getFullYear();
    const count = await prisma.auditLog.count({
      where: {
        entity: 'GatePass',
      },
    });
    const passNumber = `GP-${year}-${String(count + 1).padStart(4, '0')}`;
    const clearedAt = new Date().toISOString();

    const details = {
      passNumber,
      direction: 'INBOUND' as const,
      referenceType: 'GRN' as const,
      referenceNumber: input.referenceNumber,
      vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
      driverName: input.driverName.trim(),
      origin: input.supplierName || grn?.supplier?.name || 'Supplier',
      destination: grn?.warehouse?.name || 'Warehouse Yard',
      remarks: input.remarks || null,
      sealIntact: input.sealIntact ?? true,
      itemsCount: itemsSummary.length,
      items: itemsSummary,
      officer: {
        id: officer.id,
        name: `${officer.firstName} ${officer.lastName}`,
        email: officer.email,
      },
      clearedAt,
      status: 'CLEARED' as const,
    };

    const audit = await prisma.auditLog.create({
      data: {
        userId: officer.id,
        action: 'GATE_PASS_ENTRY_CLEARED',
        entity: 'GatePass',
        entityId: passNumber,
        details: details as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: audit.id,
      ...details,
    };
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Flags a dispatch/delivery at the gate due to discrepancy or missing papers
 */
export const flagGateDiscrepancy = async (
  input: FlagDiscrepancyInput,
  officerId: string
): Promise<GatePassRecord> => {
  const prisma = getPrisma();
  try {
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new AppError('Security officer record not found', 404);
    }

    const year = new Date().getFullYear();
    const count = await prisma.auditLog.count({
      where: {
        entity: 'GatePass',
      },
    });
    const passNumber = `HOLD-${year}-${String(count + 1).padStart(4, '0')}`;
    const clearedAt = new Date().toISOString();

    const details = {
      passNumber,
      direction: input.referenceType === 'GRN' ? ('INBOUND' as const) : ('OUTBOUND' as const),
      referenceType: input.referenceType,
      referenceNumber: input.referenceNumber,
      vehiclePlate: (input.vehiclePlate || 'N/A').trim().toUpperCase(),
      driverName: (input.driverName || 'N/A').trim(),
      remarks: input.remarks || null,
      reason: input.reason,
      itemsCount: 0,
      items: [],
      officer: {
        id: officer.id,
        name: `${officer.firstName} ${officer.lastName}`,
        email: officer.email,
      },
      clearedAt,
      status: 'FLAGGED' as const,
    };

    const audit = await prisma.auditLog.create({
      data: {
        userId: officer.id,
        action: 'GATE_PASS_FLAGGED',
        entity: 'GatePass',
        entityId: passNumber,
        details: details as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: audit.id,
      ...details,
    };
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Retrieves past gate clearances and clearance logs
 */
export const getGatePassHistory = async (params?: {
  direction?: 'OUTBOUND' | 'INBOUND';
  status?: 'CLEARED' | 'FLAGGED';
  query?: string;
}): Promise<GatePassRecord[]> => {
  const prisma = getPrisma();
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'GatePass',
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const records: GatePassRecord[] = [];

    for (const log of logs) {
      const details = (log.details as Record<string, unknown>) || {};
      const record: GatePassRecord = {
        id: log.id,
        passNumber: (details.passNumber as string) || log.entityId || 'GP-N/A',
        direction: (details.direction as 'OUTBOUND' | 'INBOUND') || 'OUTBOUND',
        referenceType: (details.referenceType as 'SIV' | 'TRANSFER' | 'GRN') || 'SIV',
        referenceNumber: (details.referenceNumber as string) || '',
        vehiclePlate: (details.vehiclePlate as string) || 'N/A',
        driverName: (details.driverName as string) || 'N/A',
        destination: (details.destination as string) || null,
        origin: (details.origin as string) || null,
        status: (details.status as 'CLEARED' | 'FLAGGED') || (log.action.includes('FLAGGED') ? 'FLAGGED' : 'CLEARED'),
        remarks: (details.remarks as string) || null,
        itemsCount: Number(details.itemsCount || 0),
        items: Array.isArray(details.items) ? (details.items as GatePassItemSummary[]) : [],
        officer: {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email,
        },
        clearedAt: (details.clearedAt as string) || log.createdAt.toISOString(),
      };

      if (params?.direction && record.direction !== params.direction) {
        continue;
      }
      if (params?.status && record.status !== params.status) {
        continue;
      }
      if (params?.query) {
        const q = params.query.toLowerCase();
        const matches =
          record.passNumber.toLowerCase().includes(q) ||
          record.referenceNumber.toLowerCase().includes(q) ||
          record.vehiclePlate.toLowerCase().includes(q) ||
          record.driverName.toLowerCase().includes(q) ||
          (record.destination && record.destination.toLowerCase().includes(q));
        if (!matches) continue;
      }

      records.push(record);
    }

    return records;
  } finally {
    await safeDisconnect(prisma);
  }
};

/**
 * Quick verification lookup by reference number (SIV, GRN, Gate Pass #)
 */
export const verifyGateReference = async (referenceNumber: string) => {
  const prisma = getPrisma();
  const trimmedRef = referenceNumber.trim();
  try {
    // 1. Check if it's an existing Gate Pass in AuditLog
    const gatePassLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'GatePass',
        OR: [
          { entityId: trimmedRef },
          {
            details: {
              path: ['passNumber'],
              equals: trimmedRef,
            },
          },
          {
            details: {
              path: ['referenceNumber'],
              equals: trimmedRef,
            },
          },
        ],
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (gatePassLog) {
      const details = (gatePassLog.details as Record<string, unknown>) || {};
      return {
        found: true,
        verificationType: 'GATE_PASS_MATCH',
        status: details.status || (gatePassLog.action.includes('FLAGGED') ? 'FLAGGED' : 'CLEARED'),
        authorized: details.status === 'CLEARED',
        gatePass: {
          id: gatePassLog.id,
          passNumber: (details.passNumber as string) || gatePassLog.entityId,
          direction: details.direction || 'OUTBOUND',
          referenceType: details.referenceType,
          referenceNumber: details.referenceNumber,
          vehiclePlate: details.vehiclePlate,
          driverName: details.driverName,
          destination: details.destination,
          remarks: details.remarks,
          items: details.items || [],
          officer: `${gatePassLog.user.firstName} ${gatePassLog.user.lastName}`,
          timestamp: details.clearedAt || gatePassLog.createdAt,
        },
      };
    }

    // 2. Check if it's an issued Requisition (SIV)
    const requisition = await prisma.requisition.findFirst({
      where: {
        OR: [
          { sivNumber: trimmedRef },
          { requisitionNumber: trimmedRef },
        ],
      },
      include: {
        requester: true,
        approver: true,
        issuer: true,
        items: {
          include: {
            inventoryItem: {
              include: { warehouse: true },
            },
          },
        },
      },
    });

    if (requisition) {
      const isIssued = requisition.status === 'ISSUED';
      const isApproved = requisition.status === 'APPROVED';

      return {
        found: true,
        verificationType: 'SIV_REQUISITION',
        status: isIssued ? 'READY_FOR_EXIT' : isApproved ? 'APPROVED_NOT_YET_ISSUED' : requisition.status,
        authorized: isIssued,
        document: {
          id: requisition.id,
          sivNumber: requisition.sivNumber,
          requisitionNumber: requisition.requisitionNumber,
          department: requisition.department,
          status: requisition.status,
          requester: `${requisition.requester.firstName} ${requisition.requester.lastName}`,
          approver: requisition.approver ? `${requisition.approver.firstName} ${requisition.approver.lastName}` : null,
          issuer: requisition.issuer ? `${requisition.issuer.firstName} ${requisition.issuer.lastName}` : null,
          issuedAt: requisition.issuedAt,
          items: requisition.items.map((i) => ({
            itemCode: i.inventoryItem.itemCode,
            name: i.inventoryItem.name,
            quantity: i.quantityRequested,
            warehouse: i.inventoryItem.warehouse.name,
          })),
        },
      };
    }

    // 3. Check if it's a GRN
    const grn = await prisma.goodsReceivingNote.findFirst({
      where: {
        grnNumber: trimmedRef,
      },
      include: {
        supplier: true,
        warehouse: true,
        user: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    if (grn) {
      return {
        found: true,
        verificationType: 'GOODS_RECEIVING_NOTE',
        status: 'READY_FOR_ENTRY',
        authorized: true,
        document: {
          id: grn.id,
          grnNumber: grn.grnNumber,
          supplier: grn.supplier.name,
          warehouse: grn.warehouse.name,
          receivedDate: grn.receivedDate,
          receivedBy: `${grn.user.firstName} ${grn.user.lastName}`,
          items: grn.items.map((i) => ({
            itemCode: i.inventoryItem.itemCode,
            name: i.inventoryItem.name,
            quantity: i.quantity,
          })),
        },
      };
    }

    return {
      found: false,
      verificationType: 'NOT_FOUND',
      status: 'UNAUTHORIZED',
      authorized: false,
      message: `No active authorization document or gate pass found matching "${trimmedRef}". Material movement not permitted.`,
    };
  } finally {
    await safeDisconnect(prisma);
  }
};

