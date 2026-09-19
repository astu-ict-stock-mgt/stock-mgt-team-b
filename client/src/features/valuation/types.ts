export type AgingBracket = '0-30 days' | '31-60 days' | '61-90 days' | '>90 days';

export interface CostLayerItem {
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
  receivedDate: string;
  ageInDays: number;
  agingBracket: AgingBracket;
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

export interface CostLayersResponse {
  summary: CostLayersSummary;
  lots: CostLayerItem[];
}

export type FinancialTransactionType = 'RECEIPT' | 'ISSUE' | 'WRITE_OFF' | 'STOCK_TAKE_ADJUSTMENT';

export interface FinancialLedgerItem {
  id: string;
  date: string;
  transactionType: FinancialTransactionType;
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

export interface FinancialLedgerResponse {
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
    from: string | null;
    to: string | null;
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
    generatedAt: string;
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

export interface ValuationFilterState {
  warehouseId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  state?: 'all' | 'active' | 'depleted';
  agingBracket?: 'all' | AgingBracket;
}
