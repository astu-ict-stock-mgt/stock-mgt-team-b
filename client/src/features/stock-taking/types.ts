// client/src/features/stock-taking/types.ts

export type SessionStatus = 'DRAFT' | 'COUNTING' | 'COMPLETED' | 'CANCELLED';
export type ReconciliationStatus = 'PENDING' | 'APPLIED' | 'REJECTED';

export interface StockTakeSession {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation?: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  createdBy: string;
  totalCounted: number;
  discrepanciesCount: number;
}

export interface WorksheetItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  systemQuantity: number;
  physicalQuantity: number | null;
  discrepancy: number | null;
  hasDiscrepancy: boolean;
  isCounted: boolean;
  countedBy: string | null;
  countedAt: string | null;
  reconciliationStatus: ReconciliationStatus | null;
  reconciliationId: string | null;
}

export interface SessionWorksheetResponse {
  session: {
    id: string;
    warehouseId: string;
    warehouseName: string;
    status: SessionStatus;
    startedAt: string;
    completedAt: string | null;
  };
  worksheet: WorksheetItem[];
}

export interface SubmitCountPayload {
  sessionId: string;
  inventoryItemId: string;
  physicalQuantity: number;
}

export interface ReconciliationItem {
  id: string;
  stockTakeCountId: string;
  sessionId: string;
  warehouseId: string;
  warehouseName: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  systemQuantity: number;
  physicalQuantity: number;
  discrepancy: number;
  status: ReconciliationStatus;
  reason?: string | null;
  unitCost?: number | null;
  countedBy: string;
  countedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ApproveReconciliationPayload {
  reconciliationId: string;
  reason: string;
  unitCost?: number;
}

export interface RejectReconciliationPayload {
  reconciliationId: string;
  reason: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  location?: string;
}
