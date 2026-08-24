import axios from 'axios';
import type {
  StockAlertItem,
  StockAlertFilter,
  PaginatedStockAlerts,
  StockSummaryStats,
  StockAlertSeverity,
  StockItemStatus,
} from './types';

const API_BASE_URL = '/api/stock-monitoring';

// Comprehensive mock dataset representing real institutional inventory items
const initialMockStockItems: Array<{
  id: string;
  itemCode: string;
  name: string;
  description: string;
  category: string;
  warehouse: string;
  warehouseLocation: string;
  currentQuantity: number;
  safetyStock: number;
  reorderLevel: number;
  minLevel: number;
  maxLevel: number;
  unit: string;
  unitCost: number;
  lastRestockedDate: string;
  lastTransactionDate: string;
}> = [
  {
    id: 'itm-001',
    itemCode: 'ICT-LAP-001',
    name: 'Dell Latitude 5520 Core i7',
    description: '15.6" FHD, 16GB RAM, 512GB SSD Enterprise Laptops',
    category: 'IT Equipment',
    warehouse: 'Central ICT Warehouse',
    warehouseLocation: 'Rack A-02, Shelf 3',
    currentQuantity: 2,
    safetyStock: 5,
    reorderLevel: 12,
    minLevel: 5,
    maxLevel: 30,
    unit: 'Units',
    unitCost: 1250.0,
    lastRestockedDate: '2026-01-10T08:00:00.000Z',
    lastTransactionDate: '2026-02-18T14:20:00.000Z',
  },
  {
    id: 'itm-002',
    itemCode: 'NET-SW-048',
    name: 'Cisco Catalyst 48-Port PoE+ Switch',
    description: 'Gigabit Managed Switch with 4x10G SFP+ Uplinks',
    category: 'Networking',
    warehouse: 'Central ICT Warehouse',
    warehouseLocation: 'Rack B-01, Shelf 1',
    currentQuantity: 1,
    safetyStock: 3,
    reorderLevel: 8,
    minLevel: 2,
    maxLevel: 15,
    unit: 'Units',
    unitCost: 890.0,
    lastRestockedDate: '2025-12-15T10:30:00.000Z',
    lastTransactionDate: '2026-02-19T09:15:00.000Z',
  },
  {
    id: 'itm-003',
    itemCode: 'NET-CAT6-BLU',
    name: 'Cat6 UTP Ethernet Cable Roll (305m)',
    description: 'Pure copper 23AWG high-speed solid cable spool',
    category: 'Networking',
    warehouse: 'Main Store Building B',
    warehouseLocation: 'Aisle 3, Bin 12',
    currentQuantity: 3,
    safetyStock: 8,
    reorderLevel: 20,
    minLevel: 5,
    maxLevel: 50,
    unit: 'Spools',
    unitCost: 110.0,
    lastRestockedDate: '2026-01-20T11:00:00.000Z',
    lastTransactionDate: '2026-02-17T16:45:00.000Z',
  },
  {
    id: 'itm-004',
    itemCode: 'SRV-RAM-32G',
    name: 'DDR4 32GB ECC Server Memory',
    description: 'Registered DIMM 3200MHz PC4-25600 for PowerEdge Servers',
    category: 'Hardware & Components',
    warehouse: 'Server Room Vault',
    warehouseLocation: 'Cabinet S-1, Tray 4',
    currentQuantity: 0,
    safetyStock: 4,
    reorderLevel: 10,
    minLevel: 2,
    maxLevel: 24,
    unit: 'Sticks',
    unitCost: 165.0,
    lastRestockedDate: '2025-11-05T13:00:00.000Z',
    lastTransactionDate: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 'itm-005',
    itemCode: 'OFF-TNR-85A',
    name: 'HP LaserJet 85A Black Toner',
    description: 'Original LaserJet Toner Cartridge (CE285A)',
    category: 'Office Supplies',
    warehouse: 'Main Store Building B',
    warehouseLocation: 'Aisle 1, Shelf 4',
    currentQuantity: 6,
    safetyStock: 5,
    reorderLevel: 18,
    minLevel: 5,
    maxLevel: 40,
    unit: 'Cartridges',
    unitCost: 45.0,
    lastRestockedDate: '2026-01-08T09:30:00.000Z',
    lastTransactionDate: '2026-02-16T11:30:00.000Z',
  },
  {
    id: 'itm-006',
    itemCode: 'ICT-MNT-27',
    name: 'Dell 27" IPS FHD Monitor (P2722H)',
    description: 'Height-adjustable ergonomic display with HDMI/DP/VGA',
    category: 'IT Equipment',
    warehouse: 'Central ICT Warehouse',
    warehouseLocation: 'Rack A-05, Shelf 2',
    currentQuantity: 7,
    safetyStock: 6,
    reorderLevel: 15,
    minLevel: 4,
    maxLevel: 35,
    unit: 'Units',
    unitCost: 220.0,
    lastRestockedDate: '2026-01-25T14:00:00.000Z',
    lastTransactionDate: '2026-02-18T15:10:00.000Z',
  },
  {
    id: 'itm-007',
    itemCode: 'PWR-UPS-1500',
    name: 'APC Smart-UPS 1500VA LCD 230V',
    description: 'Line Interactive Tower UPS with SmartConnect',
    category: 'Hardware & Components',
    warehouse: 'Central ICT Warehouse',
    warehouseLocation: 'Ground Bay 2',
    currentQuantity: 2,
    safetyStock: 3,
    reorderLevel: 6,
    minLevel: 2,
    maxLevel: 12,
    unit: 'Units',
    unitCost: 480.0,
    lastRestockedDate: '2025-12-02T10:15:00.000Z',
    lastTransactionDate: '2026-02-12T13:40:00.000Z',
  },
  {
    id: 'itm-008',
    itemCode: 'OFF-PAP-A4',
    name: 'A4 Copier Paper (80gsm, 500 Sheets)',
    description: 'High brightness premium multipurpose copy paper ream',
    category: 'Office Supplies',
    warehouse: 'Main Store Building B',
    warehouseLocation: 'Pallet Zone P-03',
    currentQuantity: 18,
    safetyStock: 15,
    reorderLevel: 50,
    minLevel: 15,
    maxLevel: 150,
    unit: 'Reams',
    unitCost: 7.5,
    lastRestockedDate: '2026-01-14T08:30:00.000Z',
    lastTransactionDate: '2026-02-19T10:00:00.000Z',
  },
  {
    id: 'itm-009',
    itemCode: 'ICT-SSD-1TB',
    name: 'Samsung 980 PRO NVMe M.2 SSD 1TB',
    description: 'PCIe 4.0 NVMe High-Speed Solid State Storage Drive',
    category: 'Hardware & Components',
    warehouse: 'Central ICT Warehouse',
    warehouseLocation: 'Cabinet S-2, Tray 1',
    currentQuantity: 4,
    safetyStock: 5,
    reorderLevel: 14,
    minLevel: 3,
    maxLevel: 25,
    unit: 'Units',
    unitCost: 105.0,
    lastRestockedDate: '2026-01-30T15:20:00.000Z',
    lastTransactionDate: '2026-02-17T09:45:00.000Z',
  },
  {
    id: 'itm-010',
    itemCode: 'ICT-KB-USB',
    name: 'Logitech MK120 USB Keyboard & Mouse Set',
    description: 'Durable spill-resistant wired keyboard and optical mouse',
    category: 'IT Equipment',
    warehouse: 'Main Store Building B',
    warehouseLocation: 'Aisle 2, Bin 05',
    currentQuantity: 8,
    safetyStock: 10,
    reorderLevel: 25,
    minLevel: 8,
    maxLevel: 60,
    unit: 'Sets',
    unitCost: 24.0,
    lastRestockedDate: '2026-01-18T10:00:00.000Z',
    lastTransactionDate: '2026-02-18T11:20:00.000Z',
  },
];

// Helper to compute calculated alert fields based on current stock vs control thresholds
function computeAlertItem(raw: (typeof initialMockStockItems)[0]): StockAlertItem {
  let severity: StockAlertSeverity = 'WARNING';
  let status: StockItemStatus = 'BELOW_REORDER';

  if (raw.currentQuantity === 0) {
    severity = 'CRITICAL';
    status = 'OUT_OF_STOCK';
  } else if (raw.currentQuantity <= raw.safetyStock) {
    severity = 'CRITICAL';
    status = 'BELOW_SAFETY';
  } else if (raw.currentQuantity <= raw.reorderLevel) {
    severity = 'WARNING';
    status = 'BELOW_REORDER';
  } else {
    status = 'ADEQUATE';
  }

  const shortageQuantity = Math.max(0, raw.reorderLevel - raw.currentQuantity);
  const safetyShortageQuantity = Math.max(0, raw.safetyStock - raw.currentQuantity);

  return {
    ...raw,
    severity,
    status,
    shortageQuantity,
    safetyShortageQuantity,
  };
}

interface RawServerStockItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string;
  category?: string | { name?: string };
  warehouse?: string | { name?: string; location?: string };
  warehouseLocation?: string;
  currentQuantity?: number;
  quantity?: number;
  safetyStock?: number;
  reorderLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  unit?: string;
  unitCost?: number;
  lastRestockedDate?: string;
  lastTransactionDate?: string;
  updatedAt?: string;
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

  try {
    const res = await axios.get<{
      success: boolean;
      data: RawServerStockItem[];
      count: number;
      criticalCount?: number;
      warningCount?: number;
    }>(`${API_BASE_URL}/alerts`, {
      params: { search, severity, category, warehouse, page, pageSize },
    });

    if (res.data && Array.isArray(res.data.data)) {
      const items: StockAlertItem[] = res.data.data.map((item: RawServerStockItem) => {
        const currentQty = item.currentQuantity ?? item.quantity ?? 0;
        const safetyQty = item.safetyStock ?? 0;
        const reorderQty = item.reorderLevel ?? 0;

        const isCritical = currentQty <= safetyQty;
        const isWarning = !isCritical && currentQty <= reorderQty;

        return {
          id: item.id,
          itemCode: item.itemCode,
          name: item.name,
          description: item.description,
          category:
            typeof item.category === 'object' && item.category !== null
              ? item.category.name || 'General'
              : typeof item.category === 'string'
                ? item.category
                : 'General',
          warehouse:
            typeof item.warehouse === 'object' && item.warehouse !== null
              ? item.warehouse.name || 'Main Warehouse'
              : typeof item.warehouse === 'string'
                ? item.warehouse
                : 'Main Warehouse',
          warehouseLocation:
            item.warehouseLocation ||
            (typeof item.warehouse === 'object' && item.warehouse !== null
              ? item.warehouse.location
              : undefined),
          currentQuantity: currentQty,
          safetyStock: safetyQty,
          reorderLevel: reorderQty,
          minLevel: item.minLevel,
          maxLevel: item.maxLevel,
          unit: item.unit || 'Units',
          unitCost: Number(item.unitCost || 0),
          severity: isCritical ? 'CRITICAL' : 'WARNING',
          status:
            currentQty === 0
              ? 'OUT_OF_STOCK'
              : isCritical
                ? 'BELOW_SAFETY'
                : isWarning
                  ? 'BELOW_REORDER'
                  : 'ADEQUATE',
          shortageQuantity: Math.max(0, reorderQty - currentQty),
          safetyShortageQuantity: Math.max(0, safetyQty - currentQty),
          lastRestockedDate: item.lastRestockedDate || item.updatedAt,
          lastTransactionDate: item.lastTransactionDate || item.updatedAt,
        };
      });

      const criticalCount =
        res.data.criticalCount ?? items.filter((i) => i.severity === 'CRITICAL').length;
      const warningCount =
        res.data.warningCount ?? items.filter((i) => i.severity === 'WARNING').length;

      return {
        data: items,
        totalCount: res.data.count || items.length,
        criticalCount,
        warningCount,
        page,
        pageSize,
      };
    }
  } catch {
    // Fallback to local mock data for client development
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Compute alerts from mock dataset (all items <= reorderLevel)
  const allAlerts = initialMockStockItems
    .map(computeAlertItem)
    .filter((item) => item.currentQuantity <= item.reorderLevel);

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

  if (category && category !== 'ALL') {
    filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  if (warehouse && warehouse !== 'ALL') {
    filtered = filtered.filter((item) => item.warehouse.toLowerCase() === warehouse.toLowerCase());
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
    const res = await axios.get<{
      success: boolean;
      stats: StockSummaryStats;
    }>(`${API_BASE_URL}/summary-stats`);
    if (res.data?.stats) {
      return res.data.stats;
    }
  } catch {
    // Fallback to computed mock stats
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  const alertItems = initialMockStockItems
    .map(computeAlertItem)
    .filter((item) => item.currentQuantity <= item.reorderLevel);

  const criticalAlerts = alertItems.filter((i) => i.severity === 'CRITICAL').length;
  const warningAlerts = alertItems.filter((i) => i.severity === 'WARNING').length;
  const outOfStockCount = alertItems.filter((i) => i.currentQuantity === 0).length;

  const totalItemsMonitored = 45; // Mock total catalogue items
  const adequateStockCount = totalItemsMonitored - alertItems.length;

  const estimatedReplenishmentCost = alertItems.reduce(
    (sum, item) => sum + item.shortageQuantity * item.unitCost,
    0
  );

  return {
    totalItemsMonitored,
    totalAlerts: alertItems.length,
    criticalAlerts,
    warningAlerts,
    outOfStockCount,
    adequateStockCount,
    estimatedReplenishmentCost,
    lastUpdated: new Date().toISOString(),
  };
}
