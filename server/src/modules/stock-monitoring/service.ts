import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
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
    // Fetch all inventory items with their bin card data
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: {
        warehouse: true,
        binCard: {
          where: warehouseId ? { warehouseId } : undefined,
        },
      },
    });

    const items: StockMonitoringItem[] = inventoryItems.map((item) => {
      // Get current stock from bin card
      const binCard = item.binCard[0];
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
        description: item.description,
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
        binCard: {
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
    const binCard = item.binCard[0];
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
      description: item.description,
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
    await prisma.$disconnect();
  }
};
