export interface ReportFilters {
  dateFrom?: Date | string;
  dateTo?: Date | string;
  warehouseId?: string;
  supplierId?: string;
  inventoryItemId?: string;
  type?: string;
  categoryId?: string;
  state?: string;
  search?: string;
}

export interface StockMovementItem {
  id: string;
  type: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  receivedDate: Date | null;
  referenceNumber: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  userId: string;
  userName?: string;
  createdAt: Date;
}

export interface StockMovementSummary {
  totalTransactions: number;
  totalReceived: number;
  totalIssued: number;
  totalTransferred: number;
  totalAdjusted: number;
  netQuantity: number;
  totalValueReceived: number;
  totalValueIssued: number;
}

export interface StockMovementReportResult {
  summary: StockMovementSummary;
  transactions: StockMovementItem[];
}

export interface ReceivingReportItem {
  id: string;
  referenceNumber: string | null;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  supplierId: string | null;
  supplierName: string | null;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  receivedDate: Date | null;
  createdAt: Date;
}

export interface ReceivingReportSummary {
  totalReceipts: number;
  totalQuantity: number;
  totalValue: number;
  uniqueSuppliers: number;
  uniqueWarehouseCount: number;
}

export interface ReceivingReportResult {
  summary: ReceivingReportSummary;
  transactions: ReceivingReportItem[];
}

export interface IssuingReportItem {
  id: string;
  referenceNumber: string | null;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitCost: number | null;
  totalValue: number | null;
  issuedTo?: string | null;
  department?: string | null;
  userId: string;
  issuedByName: string;
  createdAt: Date;
}

export interface IssuingReportSummary {
  totalIssues: number;
  totalQuantity: number;
  totalValue: number;
}

export interface IssuingReportResult {
  summary: IssuingReportSummary;
  transactions: IssuingReportItem[];
}

export interface StockLotValuation {
  lotId: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  totalLotValue: number;
  receivedDate: Date;
  isDepleted: boolean;
}

export interface ItemValuation {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  warehouseName: string;
  totalQuantityOnHand: number;
  averageUnitCost: number;
  totalFifoValue: number;
  lots: StockLotValuation[];
}

export interface ValuationReportSummary {
  totalItems: number;
  totalQuantityOnHand: number;
  totalFifoValuation: number;
  activeLotsCount: number;
}

export interface ValuationReportResult {
  summary: ValuationReportSummary;
  items: ItemValuation[];
}

export interface SupplierPerformanceItem {
  supplierId: string;
  supplierName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  totalDeliveries: number;
  totalQuantitySupplied: number;
  totalSuppliedValue: number;
  lastDeliveryDate: Date | null;
}

export interface SupplierReportSummary {
  totalSuppliers: number;
  totalDeliveries: number;
  totalValueSupplied: number;
}

export interface SupplierReportResult {
  summary: SupplierReportSummary;
  suppliers: SupplierPerformanceItem[];
}

export interface StockStatusItem {
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

export interface StockStatusSummary {
  totalItems: number;
  lowStockItemsCount: number;
  belowSafetyStockCount: number;
  outOfStockCount: number;
  stateBreakdown: Record<string, number>;
}

export interface StockStatusReportResult {
  summary: StockStatusSummary;
  items: StockStatusItem[];
}

export interface ReportsOverviewSummary {
  totalTransactions: number;
  totalReceivedValue: number;
  totalIssuedValue: number;
  totalFifoInventoryValue: number;
  totalItemsCount: number;
  lowStockCount: number;
  totalSuppliersCount: number;
}

export interface CreateReportRecordDto {
  name: string;
  type: string;
  parameters?: Record<string, unknown>;
  fileUrl?: string;
}

export interface SavedReportRecord {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  generatorName?: string;
  parameters: unknown;
  fileUrl: string | null;
  createdAt: Date;
}
