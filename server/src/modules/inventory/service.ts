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

export const getAllItemsValuationResult = async (search?: string) => {
  const items = await prisma.inventoryItem.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
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

  return items.map((item) => {
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
  });
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

export const getAllWarehouses = async () => {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, location: true },
  });
  return warehouses;
};

export const createWarehouseService = async (data: { name: string; location?: string }) => {
  return await prisma.warehouse.create({
    data: {
      name: data.name,
      location: data.location || null,
    },
  });
};
