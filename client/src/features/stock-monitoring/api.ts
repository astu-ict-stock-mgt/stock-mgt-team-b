import apiClient from '../../api/apiClient';
import type {
  StockAlertItem,
  StockAlertFilter,
  PaginatedStockAlerts,
  StockSummaryStats,
  StockAlertSeverity,
  StockItemStatus,
} from './types';

interface BackendStockStatusItem {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  warehouseName?: string;
  warehouseLocation?: string;
  state?: string;
  currentStock: number;
  minLevel?: number;
  maxLevel?: number;
  reorderLevel: number;
  safetyStock: number;
  isLowStock?: boolean;
  isBelowSafetyStock?: boolean;
  unit?: string;
  unitCost?: number;
  lastRestockedDate?: string;
  updatedAt?: string;
}

interface BackendStockStatusResponse {
  status: string;
  data: {
    summary: {
      totalItems: number;
      lowStockItemsCount: number;
      belowSafetyStockCount: number;
      outOfStockCount: number;
      stateBreakdown?: Record<string, number>;
    };
    items: BackendStockStatusItem[];
  };
}

interface GenericStockItem {
  id?: string;
  inventoryItemId?: string;
  itemCode: string;
  name?: string;
  itemName?: string;
  description?: string;
  category?: string | { name?: string };
  categoryName?: string;
  warehouse?: string | { name?: string; location?: string };
  warehouseName?: string;
  warehouseLocation?: string;
  currentQuantity?: number;
  currentStock?: number;
  quantity?: number;
  safetyStock?: number;
  reorderLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  unit?: string;
  unitCost?: number;
  lastRestockedDate?: string;
  updatedAt?: string;
}

function mapToStockAlertItem(item: GenericStockItem): StockAlertItem {
  const id = item.id || item.inventoryItemId || item.itemCode;
  const itemCode = item.itemCode;
  const name = item.name || item.itemName || itemCode;
  const currentQuantity = item.currentQuantity ?? item.currentStock ?? item.quantity ?? 0;
  const safetyStock = item.safetyStock ?? 0;
  const reorderLevel = item.reorderLevel ?? 0;

  const category =
    typeof item.category === 'object' && item.category !== null
      ? item.category.name || 'General'
      : typeof item.category === 'string'
        ? item.category
        : item.categoryName || 'General';

  const warehouse =
    typeof item.warehouse === 'object' && item.warehouse !== null
      ? item.warehouse.name || 'Main Warehouse'
      : typeof item.warehouse === 'string'
        ? item.warehouse
        : item.warehouseName || 'Main Warehouse';

  const warehouseLocation =
    item.warehouseLocation ||
    (typeof item.warehouse === 'object' && item.warehouse !== null
      ? item.warehouse.location
      : undefined);

  let severity: StockAlertSeverity = 'WARNING';
  let status: StockItemStatus = 'BELOW_REORDER';

  if (currentQuantity === 0) {
    severity = 'CRITICAL';
    status = 'OUT_OF_STOCK';
  } else if (currentQuantity <= safetyStock) {
    severity = 'CRITICAL';
    status = 'BELOW_SAFETY';
  } else if (currentQuantity <= reorderLevel) {
    severity = 'WARNING';
    status = 'BELOW_REORDER';
  } else {
    status = 'ADEATE' as StockItemStatus;
  }

  const shortageQuantity = Math.max(0, reorderLevel - currentQuantity);
  const safetyShortageQuantity = Math.max(0, safetyStock - currentQuantity);

  return {
    id,
    itemCode,
    name,
    description: item.description,
    category,
    warehouse,
    warehouseLocation,
    currentQuantity,
    safetyStock,
    reorderLevel,
    minLevel: item.minLevel,
    maxLevel: item.maxLevel,
    unit: item.unit || 'Units',
    unitCost: Number(item.unitCost || 0),
    severity,
    status,
    shortageQuantity,
    safetyShortageQuantity,
    lastRestockedDate: item.lastRestockedDate || item.updatedAt,
    lastTransactionDate: item.updatedAt,
  };
}

export async function fetchStockAlerts(
  filter: StockAlertFilter = {}
): Promise<PaginatedStockAlerts> {
  const {
    search = '',
    severity = 'ALL',
    category = '',
    warehouse = '',
    page = 1,
    pageSize = 10,
  } = filter;

  let allAlerts: StockAlertItem[] = [];

  try {
    // Attempt primary stock-monitoring endpoint first
    const res = await apiClient.get<{
      success?: boolean;
      status?: string;
      data?: GenericStockItem[];
      count?: number;
    }>('/stock-monitoring/alerts', {
      params: { search, severity, category, warehouse },
    });

    if (res.data?.data && Array.isArray(res.data.data)) {
      allAlerts = res.data.data.map(mapToStockAlertItem);
    }
  } catch {
    // Fallback to stock-status report endpoint which is active in backend routes
    try {
      const res = await apiClient.get<BackendStockStatusResponse>('/reports/stock-status');
      const backendItems = res.data?.data?.items || [];
      allAlerts = backendItems
        .filter((item) => item.currentStock <= item.reorderLevel)
        .map(mapToStockAlertItem);
    } catch {
      allAlerts = [];
    }
  }

  let filtered = [...allAlerts];

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q)
    );
  }

  if (severity && severity !== 'ALL') {
    filtered = filtered.filter((item) => item.severity === severity);
  }

  if (category && category !== 'ALL' && category.trim()) {
    filtered = filtered.filter(
      (item) => item.category.toLowerCase() === category.trim().toLowerCase()
    );
  }

  if (warehouse && warehouse !== 'ALL' && warehouse.trim()) {
    filtered = filtered.filter(
      (item) => item.warehouse.toLowerCase() === warehouse.trim().toLowerCase()
    );
  }

  const criticalCount = filtered.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = filtered.filter((i) => i.severity === 'WARNING').length;
  const totalCount = filtered.length;

  const startIndex = (page - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    totalCount,
    criticalCount,
    warningCount,
    page,
    pageSize,
  };
}

export async function fetchStockSummaryStats(): Promise<StockSummaryStats> {
  try {
    // Attempt dedicated summary endpoint
    const res = await apiClient.get<{
      success?: boolean;
      status?: string;
      stats?: StockSummaryStats;
    }>('/stock-monitoring/summary-stats');

    if (res.data?.stats) {
      return res.data.stats;
    }
  } catch {
    // Fallback to stock status report summary
  }

  try {
    const res = await apiClient.get<BackendStockStatusResponse>('/reports/stock-status');
    const summary = res.data?.data?.summary;
    const items = res.data?.data?.items || [];

    const totalItemsMonitored = summary?.totalItems ?? items.length;
    const criticalAlerts = summary?.belowSafetyStockCount ?? 0;
    const totalAlerts = summary?.lowStockItemsCount ?? 0;
    const warningAlerts = Math.max(0, totalAlerts - criticalAlerts);
    const outOfStockCount = summary?.outOfStockCount ?? 0;
    const adequateStockCount = Math.max(0, totalItemsMonitored - totalAlerts);

    const estimatedReplenishmentCost = items
      .filter((i) => i.currentStock <= i.reorderLevel)
      .reduce((sum, item) => {
        const shortage = Math.max(0, item.reorderLevel - item.currentStock);
        return sum + shortage * Number(item.unitCost || 0);
      }, 0);

    return {
      totalItemsMonitored,
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      outOfStockCount,
      adequateStockCount,
      estimatedReplenishmentCost,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return {
      totalItemsMonitored: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      outOfStockCount: 0,
      adequateStockCount: 0,
      estimatedReplenishmentCost: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}
