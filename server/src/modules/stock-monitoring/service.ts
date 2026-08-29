import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface StockMonitoringItem {
  id: string;
  itemCode: string;
  name: string;
  description: string | null;
  categoryName?: string;
  warehouseName?: string;
  warehouseLocation?: string | null;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  safetyStock: number;
  warehouseId: string;
  status: 'healthy' | 'warning' | 'critical';
  severity: 'green' | 'yellow' | 'red';
  shortageQuantity?: number;
}

export interface StockMonitoringResponse {
  critical: StockMonitoringItem[];
  warning: StockMonitoringItem[];
  healthy: StockMonitoringItem[];
  summary: {
    totalItems: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
  };
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

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }

  return databaseUrl;
};

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
};

export const getStockLevels = async (
  warehouseId?: string
): Promise<StockMonitoringResponse> => {
  const prisma = createPrismaClient();

  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: {
        warehouse: true,
        category: true,
        BinCard: {
          where: warehouseId ? { warehouseId } : undefined,
        },
      },
    });

    const items: StockMonitoringItem[] = inventoryItems.map((item) => {
      const binCard = item.BinCard[0];
      const currentStock = binCard?.balance || 0;

      let status: 'healthy' | 'warning' | 'critical';
      let severity: 'green' | 'yellow' | 'red';

      if (currentStock < item.safetyStock) {
        status = 'critical';
        severity = 'red';
      } else if (currentStock < item.reorderLevel) {
        status = 'warning';
        severity = 'yellow';
      } else {
        status = 'healthy';
        severity = 'green';
      }

      return {
        id: item.id,
        itemCode: item.itemCode,
        name: item.name,
        description: item.description,
        categoryName: item.category?.name,
        warehouseName: item.warehouse?.name,
        warehouseLocation: item.warehouse?.location,
        currentStock,
        minLevel: item.minLevel,
        maxLevel: item.maxLevel,
        reorderLevel: item.reorderLevel,
        safetyStock: item.safetyStock,
        warehouseId: item.warehouseId,
        status,
        severity,
        shortageQuantity: Math.max(0, item.reorderLevel - currentStock),
      };
    });

    const critical = items.filter((item) => item.severity === 'red');
    const warning = items.filter((item) => item.severity === 'yellow');
    const healthy = items.filter((item) => item.severity === 'green');

    return {
      critical,
      warning,
      healthy,
      summary: {
        totalItems: items.length,
        criticalCount: critical.length,
        warningCount: warning.length,
        healthyCount: healthy.length,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};

export const getItemStockLevel = async (
  itemId: string,
  warehouseId?: string
): Promise<StockMonitoringItem> => {
  const prisma = createPrismaClient();

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        warehouse: true,
        category: true,
        BinCard: {
          where: warehouseId ? { warehouseId } : undefined,
        },
      },
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    if (warehouseId && item.warehouseId !== warehouseId) {
      throw new AppError('Item does not exist in the specified warehouse', 404);
    }

    const binCard = item.BinCard[0];
    const currentStock = binCard?.balance || 0;

    let status: 'healthy' | 'warning' | 'critical';
    let severity: 'green' | 'yellow' | 'red';

    if (currentStock < item.safetyStock) {
      status = 'critical';
      severity = 'red';
    } else if (currentStock < item.reorderLevel) {
      status = 'warning';
      severity = 'yellow';
    } else {
      status = 'healthy';
      severity = 'green';
    }

    return {
      id: item.id,
      itemCode: item.itemCode,
      name: item.name,
      description: item.description,
      categoryName: item.category?.name,
      warehouseName: item.warehouse?.name,
      warehouseLocation: item.warehouse?.location,
      currentStock,
      minLevel: item.minLevel,
      maxLevel: item.maxLevel,
      reorderLevel: item.reorderLevel,
      safetyStock: item.safetyStock,
      warehouseId: item.warehouseId,
      status,
      severity,
      shortageQuantity: Math.max(0, item.reorderLevel - currentStock),
    };
  } finally {
    await prisma.$disconnect();
  }
};

export const getStockAlerts = async (filters?: {
  search?: string;
  severity?: string;
  category?: string;
  warehouse?: string;
}): Promise<StockMonitoringItem[]> => {
  const levels = await getStockLevels(filters?.warehouse);
  let allItems = [...levels.critical, ...levels.warning, ...levels.healthy];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    allItems = allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q))
    );
  }

  if (filters?.severity && filters.severity !== 'ALL') {
    const sevMap: Record<string, string> = {
      CRITICAL: 'red',
      WARNING: 'yellow',
      HEALTHY: 'green',
    };
    const targetSev = sevMap[filters.severity] || filters.severity.toLowerCase();
    allItems = allItems.filter((item) => item.severity === targetSev);
  }

  return allItems;
};

export const getStockSummaryStats = async (): Promise<StockSummaryStats> => {
  const levels = await getStockLevels();

  const totalItemsMonitored = levels.summary.totalItems;
  const criticalAlerts = levels.summary.criticalCount;
  const warningAlerts = levels.summary.warningCount;
  const totalAlerts = criticalAlerts + warningAlerts;
  const outOfStockCount = levels.critical.filter((i) => i.currentStock === 0).length;
  const adequateStockCount = levels.summary.healthyCount;

  const estimatedReplenishmentCost = [...levels.critical, ...levels.warning].reduce(
    (sum, item) => sum + (item.shortageQuantity || 0) * 10,
    0
  );

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
};

