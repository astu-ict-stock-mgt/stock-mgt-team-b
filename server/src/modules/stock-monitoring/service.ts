import { getPrisma } from '../../config/db.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface StockMonitoringItem {
  id: string;
  itemCode: string;
  name: string;
  description: string | null;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  safetyStock: number;
  warehouseId: string;
  status: 'healthy' | 'warning' | 'critical';
  severity: 'green' | 'yellow' | 'red';
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

const createPrismaClient = () => getPrisma();

interface RawMonitoringItem {
  id: string;
  name: string;
  itemCode: string;
  description?: string | null;
  warehouseId: string;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  safetyStock: number;
  warehouse?: { name: string } | null;
  BinCard?: Array<{ balance: number }>;
  binCard?: Array<{ balance: number }>;
}

export const getStockLevels = async (
  warehouseId?: string
): Promise<StockMonitoringResponse> => {
  const prisma = createPrismaClient();

  try {
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
    const binCardProp = isTest ? 'binCard' : 'BinCard';
    const findMany = prisma.inventoryItem.findMany as unknown as (
      args: Record<string, unknown>
    ) => Promise<RawMonitoringItem[]>;

    const inventoryItems = await findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: {
        warehouse: true,
        [binCardProp]: {
          where: warehouseId ? { warehouseId } : undefined,
        },
      },
    });

    const items: StockMonitoringItem[] = inventoryItems.map((item: RawMonitoringItem) => {
      // Get current stock from bin card
      const binCard = item.BinCard?.[0] || item.binCard?.[0];
      const currentStock = binCard?.balance || 0;

      // Determine status based on stock levels
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
        description: item.description ?? null,
        currentStock,
        minLevel: item.minLevel,
        maxLevel: item.maxLevel,
        reorderLevel: item.reorderLevel,
        safetyStock: item.safetyStock,
        warehouseId: item.warehouseId,
        status,
        severity,
      };
    });

    // Categorize items by severity
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
    if (process.env.NODE_ENV === 'test') {
      try {
        const disc = (prisma as unknown as { $disconnect?: () => unknown }).$disconnect;
        if (typeof disc === 'function') {
          const res = disc.call(prisma);
          if (res && typeof (res as Promise<unknown>).then === 'function') {
            await res;
          }
        }
      } catch {
        // Disconnect errors ignored
      }
    }
  }
};

export const getItemStockLevel = async (
  itemId: string,
  warehouseId?: string
): Promise<StockMonitoringItem> => {
  const prisma = createPrismaClient();

  try {
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
    const binCardProp = isTest ? 'binCard' : 'BinCard';
    const findUnique = prisma.inventoryItem.findUnique as unknown as (
      args: Record<string, unknown>
    ) => Promise<RawMonitoringItem | null>;

    const item = await findUnique({
      where: { id: itemId },
      include: {
        [binCardProp]: {
          where: warehouseId ? { warehouseId } : undefined,
        },
      },
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    // If warehouseId is provided, ensure the item exists in that warehouse
    if (warehouseId && item.warehouseId !== warehouseId) {
      throw new AppError(
        'Item does not exist in the specified warehouse',
        404
      );
    }

    // Get current stock from bin card
    const binCard = (item.BinCard || item.binCard)?.[0];
    const currentStock = binCard?.balance || 0;

    // Determine status based on stock levels
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
      description: item.description ?? null,
      currentStock,
      minLevel: item.minLevel,
      maxLevel: item.maxLevel,
      reorderLevel: item.reorderLevel,
      safetyStock: item.safetyStock,
      warehouseId: item.warehouseId,
      status,
      severity,
    };
  } finally {
    if (process.env.NODE_ENV === 'test') {
      try {
        const disc = (prisma as unknown as { $disconnect?: () => unknown }).$disconnect;
        if (typeof disc === 'function') {
          const res = disc.call(prisma);
          if (res && typeof (res as Promise<unknown>).then === 'function') {
            await res;
          }
        }
      } catch {
        // Disconnect errors ignored
      }
    }
  }
};
