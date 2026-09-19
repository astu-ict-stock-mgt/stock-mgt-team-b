import {
  PrismaClient,
  ItemState,
} from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

import 'dotenv/config';

// Fetch the database environment variable.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
}

// Initialize Prisma Client using the PostgreSQL driver adapter.
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

export const getAllItemsValuationResult = async (filters?: {
  search?: string;
  category?: string;
  warehouseId?: string;
  page?: number;
  limit?: number;
}) => {
  const where: Record<string, unknown> = {};
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { itemCode: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.category) {
    where.category = { name: { equals: filters.category, mode: 'insensitive' } };
  }
  if (filters?.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      warehouse: true,
      StockLot: {
        where: {
          isDepleted: false,
        },
        orderBy: {
          receivedDate: 'asc',
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formatted = items.map((item) => {
    const totalQuantity = item.StockLot.reduce(
      (sum, lot) => sum + lot.quantityRemaining,
      0,
    );

    const totalValue = item.StockLot.reduce(
      (sum, lot) =>
        sum + lot.quantityRemaining * lot.unitCost,
      0,
    );

    return {
      id: item.id,
      itemCode: item.itemCode,
      sku: item.itemCode,
      name: item.name,
      description: item.description,
      state: item.state,
      category: item.category?.name ?? 'General',
      categoryId: item.categoryId,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse?.name ?? 'Unknown',
      quantity: totalQuantity,
      totalQuantity,
      unit: 'pcs',
      totalValue,
      minStock: item.minLevel,
      maxStock: item.maxLevel,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });

  if (filters?.page && filters?.limit) {
    const total = formatted.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const paginated = formatted.slice(startIndex, startIndex + filters.limit);
    return {
      data: paginated,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  return formatted;
};

export const getItemValuationResult = async (
  itemId: string,
) => {
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id: itemId,
    },
    include: {
      StockLot: {
        where: {
          isDepleted: false,
        },
        orderBy: {
          receivedDate: 'asc',
        },
      },
    },
  });

  if (!item) {
    throw new Error(
      `Inventory item with ID ${itemId} not found`,
    );
  }

  const totalQuantity = item.StockLot.reduce(
    (sum, lot) => sum + lot.quantityRemaining,
    0,
  );

  const totalValue = item.StockLot.reduce(
    (sum, lot) =>
      sum + lot.quantityRemaining * lot.unitCost,
    0,
  );

  return {
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    description: item.description,
    state: item.state,
    totalQuantity,
    totalValue,
  };
};

export const getItemStockLots = async (
  itemId: string,
) => {
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id: itemId,
    },
    include: {
      StockLot: {
        where: {
          isDepleted: false,
        },
        orderBy: {
          receivedDate: 'asc',
        },
      },
    },
  });

  if (!item) {
    throw new Error(
      `Inventory item with ID ${itemId} not found`,
    );
  }

  return item.StockLot.map((lot) => ({
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted,
  }));
};

export const getItemStockLotById = async (
  itemId: string,
  lotId: string,
) => {
  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      inventoryItemId: itemId,
    },
  });

  if (!lot) {
    throw new Error(
      `Stock lot with ID ${lotId} for item ID ${itemId} not found`,
    );
  }

  return {
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted,
  };
};

export const getItemStockLotValuation = async (
  itemId: string,
  lotId: string,
) => {
  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      inventoryItemId: itemId,
    },
  });

  if (!lot) {
    throw new Error(
      `Stock lot with ID ${lotId} for item ID ${itemId} not found`,
    );
  }

  const totalValue =
    lot.quantityRemaining * lot.unitCost;

  return {
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted,
    totalValue,
  };
};

export const createInventoryItem = async (itemData: {
  itemCode: string;
  name: string;
  description: string;
  state: ItemState;
  categoryId: string;
  warehouseId: string;
}) => {
  const newItem = await prisma.inventoryItem.create({
    data: itemData,
  });

  return newItem;
};

export const createStockLot = async (
  itemId: string,
  lotData: {
    quantityReceived: number;
    quantityRemaining: number;
    unitCost: number;
    receivedDate: Date;
  },
) => {
  const newLot = await prisma.stockLot.create({
    data: {
      ...lotData,
      inventoryItemId: itemId,
    },
  });

  return newLot;
};

export const updateInventoryItem = async (
  itemId: string,
  updateData: Partial<{
    itemCode: string;
    name: string;
    description: string;
    state: ItemState;
  }>,
) => {
  const updatedItem =
    await prisma.inventoryItem.updateMany({
      where: {
        id: itemId,
      },
      data: updateData,
    });

  if (updatedItem.count === 0) {
    throw new Error(
      `Inventory item with ID ${itemId} not found or no changes made`,
    );
  }

  return updatedItem;
};

export const deleteInventoryItem = async (
  itemId: string,
) => {
  const deletedItem =
    await prisma.inventoryItem.deleteMany({
      where: {
        id: itemId,
      },
    });

  if (deletedItem.count === 0) {
    throw new Error(
      `Inventory item with ID ${itemId} not found`,
    );
  }

  return deletedItem;
};

export const updateStockLot = async (
  itemId: string,
  lotId: string,
  updateData: Partial<{
    quantityRemaining: number;
    unitCost: number;
    receivedDate: Date;
    isDepleted: boolean;
  }>,
) => {
  const updatedLot = await prisma.stockLot.updateMany({
    where: {
      id: lotId,
      inventoryItemId: itemId,
    },
    data: updateData,
  });

  if (updatedLot.count === 0) {
    throw new Error(
      `Stock lot with ID ${lotId} for item ID ${itemId} not found or no changes made`,
    );
  }

  return updatedLot;
};

export const deleteStockLot = async (
  itemId: string,
  lotId: string,
) => {
  const deletedLot = await prisma.stockLot.deleteMany({
    where: {
      id: lotId,
      inventoryItemId: itemId,
    },
  });

  if (deletedLot.count === 0) {
    throw new Error(
      `Stock lot with ID ${lotId} for item ID ${itemId} not found`,
    );
  }

  return deletedLot;
};

export const getInventoryCategories = async (): Promise<string[]> => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  return categories.map((c) => c.name);
};

export const getInventoryWarehouses = async () => {
  return await prisma.warehouse.findMany({
    orderBy: { name: 'asc' },
  });
};