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

// Data Aggregation & Analytics Interfaces
export interface CategoryMovementAggregation {
  categoryId: string;
  categoryName: string;
  totalReceivedQty: number;
  totalIssuedQty: number;
  totalReceivedValue: number;
  totalIssuedValue: number;
  netQuantity: number;
  totalTransactions: number;
}

export interface WarehouseMovementAggregation {
  warehouseId: string;
  warehouseName: string;
  location: string | null;
  totalReceivedQty: number;
  totalIssuedQty: number;
  totalTransferredQty: number;
  totalTransactions: number;
  totalValuation: number;
}

export interface MonthlyTrendAggregation {
  month: string; // YYYY-MM
  totalReceivedValue: number;
  totalIssuedValue: number;
  totalReceivedQty: number;
  totalIssuedQty: number;
  totalTransactions: number;
}

export interface TopIssuedItemAggregation {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  totalQuantityIssued: number;
  totalValueIssued: number;
  issueTransactionCount: number;
}

export interface CategoryValuationAggregation {
  categoryId: string;
  categoryName: string;
  totalItemsCount: number;
  totalQuantityOnHand: number;
  totalFifoValuation: number;
  percentageOfTotalValuation: number;
}

// Financial Valuation & Costing Workspace Types (Accountant Role)
export interface CostLayerAnalysisItem {
  lotId: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  warehouseName: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  totalLotValue: number;
  receivedDate: Date;
  ageInDays: number;
  agingBracket: '0-30 days' | '31-60 days' | '61-90 days' | '>90 days';
  isDepleted: boolean;
}

export interface CostLayersSummary {
  totalLots: number;
  activeLotsCount: number;
  depletedLotsCount: number;
  totalQuantityRemaining: number;
  totalValuation: number;
  averageLotAgeDays: number;
  agingBreakdown: {
    '0-30 days': { count: number; value: number };
    '31-60 days': { count: number; value: number };
    '61-90 days': { count: number; value: number };
    '>90 days': { count: number; value: number };
  };
}

export interface CostLayersReportResult {
  summary: CostLayersSummary;
  lots: CostLayerAnalysisItem[];
}

export interface FinancialLedgerItem {
  id: string;
  date: Date;
  transactionType: 'RECEIPT' | 'ISSUE' | 'WRITE_OFF' | 'STOCK_TAKE_ADJUSTMENT';
  referenceNumber: string | null;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  debit: number;
  credit: number;
  netChange: number;
  details?: string;
  userName?: string;
}

export interface FinancialLedgerSummary {
  totalDebits: number;
  totalCredits: number;
  netMovement: number;
  receiptsTotalValue: number;
  issuesTotalValue: number;
  writeOffsTotalValue: number;
  adjustmentsNetValue: number;
}

export interface FinancialLedgerResult {
  summary: FinancialLedgerSummary;
  entries: FinancialLedgerItem[];
}

export interface FiscalCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalItems: number;
  quantity: number;
  valuation: number;
  percentage: number;
}

export interface FiscalWarehouseBreakdown {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  valuation: number;
  percentage: number;
}

export interface FiscalStatementData {
  period: {
    from: Date | string | null;
    to: Date | string | null;
  };
  beginningInventoryValue: number;
  inboundPurchasesValue: number;
  materialConsumptionValue: number;
  writeOffLossesValue: number;
  stockTakeAdjustmentNetValue: number;
  endingInventoryValue: number;
  categoryBreakdown: FiscalCategoryBreakdown[];
  warehouseBreakdown: FiscalWarehouseBreakdown[];
  certification: {
    preparedByRole: string;
    certificationStatement: string;
    generatedAt: Date;
  };
}

export interface AccountantFinancialSummary {
  totalInventoryValue: number;
  monthToDateConsumedValue: number;
  totalWriteOffLosses: number;
  unadjustedDiscrepanciesValue: number;
  activeCostLayersCount: number;
  totalItemsCount: number;
}


