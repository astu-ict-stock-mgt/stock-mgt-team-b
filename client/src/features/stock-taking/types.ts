export type StockTakeStatus = 'DRAFT' | 'COUNTING' | 'COMPLETED';
export type ReconciliationStatus = 'PENDING' | 'APPLIED' | 'REJECTED';

export interface StockTakeSession {
  id: string;
  warehouseId: string;
  status: StockTakeStatus;
  startedAt: string;
  completedAt?: string;
  counts?: StockTakeCount[];
}

export interface StockTakeCount {
  id: string;
  stockTakeId: string;
  inventoryItemId: string;
  systemQuantity: number;
  physicalQuantity: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
  countedBy: string;
  countedAt: string;
  inventoryItem?: InventoryItem;
  reconciliation?: Reconciliation | null;
}

export interface Reconciliation {
  id: string;
  stockTakeCountId: string;
  inventoryItemId: string;
  warehouseId: string;
  discrepancy: number;
  status: ReconciliationStatus;
  reason?: string;
  unitCost?: number;
  approvedBy?: string;
  approvedAt?: string;
  appliedAt?: string;
  stockTakeCount?: StockTakeCount;
  inventoryItem?: InventoryItem;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  category?: string;
  unitPrice?: number;
  currentStock?: number;   // from stock-monitoring
  warehouseId: string;
}