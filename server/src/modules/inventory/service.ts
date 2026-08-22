import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import type { InputStockLot } from './fifo.ts';
import 'dotenv/config';

// 1. Fetch your database environment variable
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
}

// 2. Initialize Prisma Client using the explicit driver adapter to prevent initialization crashes
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

export const getAllItemsValuationResult = async () => {
  // Pull items along with their active non-depleted stock batches
  const items = await prisma.inventoryItem.findMany({
    include: {
      StockLot: {
        where: { isDepleted: false },
        orderBy: { receivedDate: 'asc' } // Sorted by FIFO safety sequence
      }
    }
  });

  return items.map(item => {
    // Dynamically calculate total values across active batches
    const totalQuantity = item.StockLot.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
    const totalValue = item.StockLot.reduce((sum, lot) => sum + (lot.quantityRemaining * lot.unitCost), 0);

    return {
      id: item.id,
      itemCode: item.itemCode,
      name: item.name,
      description: item.description,
      state: item.state,
      totalQuantity,
      totalValue
    };
  });
};

export const getItemValuationResult = async (itemId: string) => {
  // Pull the specific item along with its active non-depleted stock batches
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      StockLot: {
        where: { isDepleted: false },
        orderBy: { receivedDate: 'asc' } // Sorted by FIFO safety sequence
      }
    }
  });

  if (!item) {
    throw new Error(`Inventory item with ID ${itemId} not found`);
  }

  // Dynamically calculate total values across active batches
  const totalQuantity = item.StockLot.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
  const totalValue = item.StockLot.reduce((sum, lot) => sum + (lot.quantityRemaining * lot.unitCost), 0);

  return {
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    description: item.description,
    state: item.state,
    totalQuantity,
    totalValue
  };
};

export const getItemStockLots = async (itemId: string) => {
  // Pull the specific item along with its active non-depleted stock batches
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      StockLot: {
        where: { isDepleted: false },
        orderBy: { receivedDate: 'asc' } // Sorted by FIFO safety sequence
      }
    }
  });

  if (!item) {
    throw new Error(`Inventory item with ID ${itemId} not found`);
  }

  return item.StockLot.map(lot => ({
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted
  }));
};

export const getItemStockLotById = async (itemId: string, lotId: string) => {
  // Pull the specific stock lot for the given item
  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      inventoryItemId: itemId
    }
  });

  if (!lot) {
    throw new Error(`Stock lot with ID ${lotId} for item ID ${itemId} not found`);
  }

  return {
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted
  };
};

export const getItemStockLotValuation = async (itemId: string, lotId: string) => {
  // Pull the specific stock lot for the given item
  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      inventoryItemId: itemId
    }
  });

  if (!lot) {
    throw new Error(`Stock lot with ID ${lotId} for item ID ${itemId} not found`);
  }

  const totalValue = lot.quantityRemaining * lot.unitCost;

  return {
    id: lot.id,
    quantityRemaining: lot.quantityRemaining,
    unitCost: lot.unitCost,
    receivedDate: lot.receivedDate,
    isDepleted: lot.isDepleted,
    totalValue
  };
};

export const createInventoryItem = async (itemData: { itemCode: string; name: string; description: string; state: any; categoryId: string; warehouseId: string }) => {
  const newItem = await prisma.inventoryItem.create({
    data: itemData
  });

  return newItem;
};

export const createStockLot = async (itemId: string, lotData: { quantityReceived: number; quantityRemaining: number; unitCost: number; receivedDate: Date }) => {
  const newLot = await prisma.stockLot.create({
    data: {
      ...lotData,
      inventoryItemId: itemId
    }
  });

  return newLot;
};

export const updateInventoryItem = async (itemId: string, updateData: Partial<{ itemCode: string; name: string; description: string; state: any }>) => {
  const updatedItem = await prisma.inventoryItem.updateMany({
    where: { id: itemId },
    data: updateData
  });

  if (updatedItem.count === 0) {
    throw new Error(`Inventory item with ID ${itemId} not found or no changes made`);
  }

  return updatedItem;
};

export const deleteInventoryItem = async (itemId: string) => {
  const deletedItem = await prisma.inventoryItem.deleteMany({
    where: { id: itemId }
  });

  if (deletedItem.count === 0) {
    throw new Error(`Inventory item with ID ${itemId} not found`);
  }

  return deletedItem;
};

export const updateStockLot = async (itemId: string, lotId: string, updateData: Partial<{ quantityRemaining: number; unitCost: number; receivedDate: Date; isDepleted: boolean }>) => {
  const updatedLot = await prisma.stockLot.updateMany({
    where: {
      id: lotId,
      inventoryItemId: itemId
    },
    data: updateData
  });

  if (updatedLot.count === 0) {
    throw new Error(`Stock lot with ID ${lotId} for item ID ${itemId} not found or no changes made`);
  }

  return updatedLot;
};

export const deleteStockLot = async (itemId: string, lotId: string) => {
  const deletedLot = await prisma.stockLot.deleteMany({
    where: {
      id: lotId,
      inventoryItemId: itemId
    }
  });

  if (deletedLot.count === 0) {
    throw new Error(`Stock lot with ID ${lotId} for item ID ${itemId} not found`);
  }

  return deletedLot;
};
