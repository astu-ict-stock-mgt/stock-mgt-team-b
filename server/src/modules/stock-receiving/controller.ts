import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import {
  createReceiving,
  getReceivingNotes,
  getReceivingNoteById,
  sendToInspection,
  submitInspectionReport,
  confirmRouting,
  paoApprove,
  paoReject,
} from './service.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Response mappers
// ─────────────────────────────────────────────────────────────────────────────

type GrnRecord = Awaited<ReturnType<typeof getReceivingNoteById>>;

function toGrnSummary(note: GrnRecord) {
  const totalValue = note.items
    .filter((i) => i.acceptedQty !== null && i.acceptedQty > 0)
    .reduce((sum, i) => sum + (i.acceptedQty ?? i.quantity) * Number(i.unitCost), 0)
    // fall back if inspection hasn't happened yet
    || note.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitCost), 0);

  return {
    id: note.id,
    grnNumber: note.grnNumber,
    receivedDate: note.receivedDate.toISOString(),
    supplierName: note.supplier?.name ?? 'Unknown Supplier',
    warehouseName: note.warehouse?.name ?? 'Unknown Warehouse',
    totalValue,
    status: note.status,
    inspectedBy: note.inspectedBy,
    approvedBy: note.approvedBy,
    rejectionReason: note.rejectionReason,
  };
}

function toGrnDetail(note: GrnRecord) {
  const totalValue = note.items
    .filter((i) => i.acceptedQty !== null && i.acceptedQty > 0)
    .reduce((sum, i) => sum + (i.acceptedQty ?? i.quantity) * Number(i.unitCost), 0)
    || note.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitCost), 0);

  return {
    id: note.id,
    grnNumber: note.grnNumber,
    supplierId: note.supplierId,
    supplierName: note.supplier?.name ?? 'Unknown Supplier',
    warehouseId: note.warehouseId,
    warehouseName: note.warehouse?.name ?? 'Unknown Warehouse',
    receivedDate: note.receivedDate.toISOString(),
    createdBy: note.user ? `${note.user.firstName} ${note.user.lastName}` : 'System',
    createdAt: note.createdAt.toISOString(),
    status: note.status,
    inspectedBy: note.inspectedBy,
    inspectedAt: note.inspectedAt?.toISOString() ?? null,
    inspectorNotes: note.inspectorNotes,
    approvedBy: note.approvedBy,
    approvedAt: note.approvedAt?.toISOString() ?? null,
    rejectedBy: note.rejectedBy,
    rejectedAt: note.rejectedAt?.toISOString() ?? null,
    rejectionReason: note.rejectionReason,
    totalValue,
    lineItems: note.items.map((item) => ({
      id: item.id,
      itemId: item.inventoryItemId,
      itemName: item.inventoryItem?.name ?? 'Unknown Item',
      itemSku: item.inventoryItem?.itemCode ?? '',
      unit: 'Units',
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      lineTotal: Number(item.quantity) * Number(item.unitCost),
      acceptedQty: item.acceptedQty ?? null,
      damagedQty: item.damagedQty ?? null,
      inspectorRemarks: item.inspectorRemarks ?? null,
      inspectionResult: item.inspectionStatus === 'ACCEPTED' ? 'Accepted' : 'Rejected',
      remarks: item.rejectionReason ?? undefined,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1 — Create Draft GRN
// ─────────────────────────────────────────────────────────────────────────────

export const createReceivingNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const clientBody = req.body as {
      supplierId: string;
      warehouseId: string;
      receivedDate?: string;
      lineItems: Array<{ itemId: string; quantity: number; unitCost: number }>;
    };

    const serverPayload = {
      supplierId: clientBody.supplierId,
      warehouseId: clientBody.warehouseId,
      receivedDate: clientBody.receivedDate,
      items: (clientBody.lineItems ?? []).map((li) => ({
        inventoryItemId: li.itemId,
        quantity: li.quantity,
        unitCost: li.unitCost,
      })),
    };

    const result = await createReceiving(serverPayload, req.user.id);
    const grn = await getReceivingNoteById(result.id);

    res.status(201).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 — Send to Inspection
// ─────────────────────────────────────────────────────────────────────────────

export const sendToInspectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    await sendToInspection(id, req.user.id);
    const grn = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 — Inspector Submits Report
// ─────────────────────────────────────────────────────────────────────────────

export const submitInspectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;

    const body = req.body as {
      items: Array<{
        itemId: string;
        acceptedQty: number;
        damagedQty: number;
        inspectorRemarks?: string;
      }>;
      inspectorNotes?: string;
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError('Inspection items are required', 400);
    }

    await submitInspectionReport(id, body.items, body.inspectorNotes, req.user.id);
    const grn = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 — Storekeeper Confirms Routing
// ─────────────────────────────────────────────────────────────────────────────

export const confirmRoutingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    await confirmRouting(id, req.user.id);
    const grn = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 5a — PAO Approves
// ─────────────────────────────────────────────────────────────────────────────

export const paoApproveController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    await paoApprove(id, req.user.id);
    const grn = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 5b — PAO Rejects
// ─────────────────────────────────────────────────────────────────────────────

export const paoRejectController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;

    const { reason } = req.body as { reason?: string };
    if (!reason?.trim()) throw new AppError('Rejection reason is required', 400);

    await paoReject(id, req.user.id, reason);
    const grn = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(grn) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Read handlers
// ─────────────────────────────────────────────────────────────────────────────

export const getReceivingNotesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const status = req.query.status as string | undefined;
    const result = await getReceivingNotes(status);
    res.status(200).json({ status: 'success', data: result.map(toGrnSummary) });
  } catch (error) {
    next(error);
  }
};

export const getReceivingNoteByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    const result = await getReceivingNoteById(id);
    res.status(200).json({ status: 'success', data: toGrnDetail(result) });
  } catch (error) {
    next(error);
  }
};
