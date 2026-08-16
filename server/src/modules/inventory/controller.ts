import type { NextFunction, Request, Response } from 'express';
import { 
  getAllItemsValuationResult, 
  getItemStockLotValuation, 
  getItemStockLotById, 
  getItemValuationResult, 
  getItemStockLots,
  createInventoryItem,
  createStockLot,
  updateInventoryItem,
  deleteInventoryItem,
  updateStockLot,
  deleteStockLot
} from './service.ts';

export const getInventoryItems = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getAllItemsValuationResult();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const data = await getItemValuationResult(itemId!);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemStockLots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const data = await getItemStockLots(itemId!);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemStockLotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    const data = await getItemStockLotById(itemId!, lotId!);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemStockLotValuation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    const data = await getItemStockLotValuation(itemId!, lotId!);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const createInventoryItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await createInventoryItem(req.body);
    res.status(201).json({ 
      message: 'Inventory item created successfully', 
      data: record 
    });
  } catch (error: any) {
    // Check if it is a Prisma unique constraint violation code (P2002)
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'An item with this itemCode already exists. Please use a unique itemCode.'
      });
      return;
    }
    next(error);
  }
};


export const createStockLotController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const record = await createStockLot(itemId!, req.body);
    res.status(201).json({ 
      message: 'Stock lot created successfully', 
      data: record 
    });
  } catch (error: any) {
    // Check if it is a Prisma unique constraint violation code (P2002)
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'A stock lot with this lotCode already exists. Please use a unique lotCode.'
      });
      return;
    }
    next(error);
  }
};

export const updateInventoryItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;

    // 1. Check if the body payload is completely empty or has no keys
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        status: "error",
        message: "Bad Request: No update data fields were provided in the request body."
      });
      return;
    }

    // 2. Proceed with database update if fields exist
    const result = await updateInventoryItem(itemId!, req.body);
    res.status(200).json({ 
      message: 'Inventory item updated successfully', 
      count: result.count 
    });
  } catch (error) {
    next(error);
  }
};


export const updateStockLotController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    const result = await updateStockLot(itemId!, lotId!, req.body);
    res.status(200).json({ 
      message: 'Stock lot updated successfully', 
      count: result.count 
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteInventoryItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    await deleteInventoryItem(itemId!);
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};

export const deleteStockLotController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    await deleteStockLot(itemId!, lotId!);
    res.status(200).json({ message: 'Stock lot deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};
