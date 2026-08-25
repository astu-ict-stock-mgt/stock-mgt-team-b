export type StockAlertSeverity = 'CRITICAL' | 'WARNING';

export type StockItemStatus = 'OUT_OF_STOCK' | 'BELOW_SAFETY' | 'BELOW_REORDER' | 'ADEQUATE';

export interface StockAlertItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string;
  category: string;
  warehouse: string;
  warehouseLocation?: string;
  currentQuantity: number;
  safetyStock: number;
  reorderLevel: number;
  minLevel?: number;
  maxLevel?: number;
  unit: string;
  unitCost: number;
  severity: StockAlertSeverity;
  status: StockItemStatus;
  shortageQuantity: number; // reorderLevel - currentQuantity
  safetyShortageQuantity: number; // safetyStock - currentQuantity (if > 0)
  lastRestockedDate?: string;
  lastTransactionDate?: string;
}

export interface StockAlertFilter {
  search?: string;
  severity?: 'ALL' | 'CRITICAL' | 'WARNING';
  category?: string;
  warehouse?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedStockAlerts {
  data: StockAlertItem[];
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  page: number;
  pageSize: number;
}

export interface StockSummaryStats {
  totalItemsMonitored: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  outOfStockCount: number;
  adequateStockCount: number;
  estimatedReplenishmentCost: number;
  lastUpdated: string;
}
