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

// Central error helper to translate Prisma exceptions into clear HTTP Responses
const handleControllerError = (error: any, res: Response, next: NextFunction, structuralContext: string) => {
  // P2002: Unique Constraint Violations (Duplicate names/SKUs)
  if (error.code === 'P2002') {
    return res.status(409).json({
      status: 'error',
      message: `Conflict: A record with unique parameters already exists within ${structuralContext}.`
    });
  }

  // P2025: Record to update/delete not found in database rows
  if (error.code === 'P2025' || error.message?.includes('not found')) {
    return res.status(404).json({
      status: 'error',
      message: `Not Found: The specified ${structuralContext} record identifier does not exist.`
    });
  }

  // Handle invalid UUID formatting cast conversion failures
  if (error.message?.includes('invalid input syntax for type uuid') || error.code === 'P2023') {
    return res.status(400).json({
      status: 'error',
      message: 'Bad Request: The provided identifier does not match standard unique string rules.'
    });
  }

  // Pass along to global system error handler middleware if unknown
  next(error);
};

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
  } catch (error: any) {
    handleControllerError(error, res, next, 'Inventory Item');
  }
};

export const getInventoryItemStockLots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const data = await getItemStockLots(itemId!);
    res.status(200).json(data);
  } catch (error: any) {
    handleControllerError(error, res, next, 'Inventory Item Lots');
  }
};

export const getInventoryItemStockLotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    const data = await getItemStockLotById(itemId!, lotId!);
    res.status(200).json(data);
  } catch (error: any) {
    handleControllerError(error, res, next, 'Stock Lot');
  }
};

export const getInventoryItemStockLotValuation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    const data = await getItemStockLotValuation(itemId!, lotId!);
    res.status(200).json(data);
  } catch (error: any) {
    handleControllerError(error, res, next, 'Stock Lot Valuation');
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
    handleControllerError(error, res, next, 'Inventory Item');
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
    handleControllerError(error, res, next, 'Stock Lot');
  }
};

export const updateInventoryItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        status: "error",
        message: "Bad Request: No update data fields were provided in the request body."
      });
      return;
    }

    const result = await updateInventoryItem(itemId!, req.body);
    res.status(200).json({ 
      message: 'Inventory item updated successfully', 
      count: result.count 
    });
  } catch (error: any) {
    handleControllerError(error, res, next, 'Inventory Item');
  }
};

export const updateStockLotController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        status: "error",
        message: "Bad Request: No lot update properties were specified in the request body."
      });
      return;
    }

    const result = await updateStockLot(itemId!, lotId!, req.body);
    res.status(200).json({ 
      message: 'Stock lot updated successfully', 
      count: result.count 
    });
  } catch (error: any) {
    handleControllerError(error, res, next, 'Stock Lot');
  }
};

export const deleteInventoryItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    await deleteInventoryItem(itemId!);
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    handleControllerError(error, res, next, 'Inventory Item');
  }
};

export const deleteStockLotController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, lotId } = req.params;
    await deleteStockLot(itemId!, lotId!);
    res.status(200).json({ message: 'Stock lot deleted successfully' });
  } catch (error: any) {
    handleControllerError(error, res, next, 'Stock Lot');
  }
};
