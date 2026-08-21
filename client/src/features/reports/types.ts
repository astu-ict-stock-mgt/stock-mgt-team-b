export type ReportType =
  | 'overview'
  | 'stock-movement'
  | 'receiving'
  | 'issuing'
  | 'valuation'
  | 'suppliers'
  | 'stock-status'
  | 'history';

export interface ReportFiltersState {
  dateFrom: string;
  dateTo: string;
  warehouseId: string;
  supplierId: string;
  inventoryItemId: string;
  type: string;
  search: string;
}

export interface StockMovementRow {
  id: string;
  type: 'RECEIVE' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT';
  itemCode: string;
  itemName: string;
  categoryName?: string;
  warehouseName?: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  referenceNumber: string | null;
  supplierName?: string | null;
  userName?: string;
  createdAt: string;
}

export interface StockMovementReportData {
  summary: {
    totalTransactions: number;
    totalReceived: number;
    totalIssued: number;
    totalTransferred: number;
    totalAdjusted: number;
    netQuantity: number;
    totalValueReceived: number;
    totalValueIssued: number;
  };
  transactions: StockMovementRow[];
}

export interface ReceivingReportRow {
  id: string;
  referenceNumber: string | null;
  itemCode: string;
  itemName: string;
  supplierName: string | null;
  warehouseName: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  receivedDate: string | null;
  createdAt: string;
}

export interface ReceivingReportData {
  summary: {
    totalReceipts: number;
    totalQuantity: number;
    totalValue: number;
    uniqueSuppliers: number;
    uniqueWarehouseCount: number;
  };
  transactions: ReceivingReportRow[];
}

export interface IssuingReportRow {
  id: string;
  referenceNumber: string | null;
  itemCode: string;
  itemName: string;
  warehouseName: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  department: string | null;
  issuedByName: string;
  createdAt: string;
}

export interface IssuingReportData {
  summary: {
    totalIssues: number;
    totalQuantity: number;
    totalValue: number;
  };
  transactions: IssuingReportRow[];
}

export interface LotValuationRow {
  lotId: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  totalLotValue: number;
  receivedDate: string;
  isDepleted: boolean;
}

export interface ItemValuationRow {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  warehouseName: string;
  totalQuantityOnHand: number;
  averageUnitCost: number;
  totalFifoValue: number;
  lots: LotValuationRow[];
}

export interface ValuationReportData {
  summary: {
    totalItems: number;
    totalQuantityOnHand: number;
    totalFifoValuation: number;
    activeLotsCount: number;
  };
  items: ItemValuationRow[];
}

export interface SupplierPerformanceRow {
  supplierId: string;
  supplierName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  totalDeliveries: number;
  totalQuantitySupplied: number;
  totalSuppliedValue: number;
  lastDeliveryDate: string | null;
}

export interface SupplierReportData {
  summary: {
    totalSuppliers: number;
    totalDeliveries: number;
    totalValueSupplied: number;
  };
  suppliers: SupplierPerformanceRow[];
}

export interface StockStatusRow {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  warehouseName: string;
  state: string;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  safetyStock: number;
  isLowStock: boolean;
  isBelowSafetyStock: boolean;
}

export interface StockStatusReportData {
  summary: {
    totalItems: number;
    lowStockItemsCount: number;
    belowSafetyStockCount: number;
    outOfStockCount: number;
    stateBreakdown: Record<string, number>;
  };
  items: StockStatusRow[];
}

export interface ReportsSummaryData {
  totalTransactions: number;
  totalReceivedValue: number;
  totalIssuedValue: number;
  totalFifoInventoryValue: number;
  totalItemsCount: number;
  lowStockCount: number;
  totalSuppliersCount: number;
}

export interface SavedReportItem {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  generatorName?: string;
  parameters: Record<string, unknown>;
  fileUrl: string | null;
  createdAt: string;
}
