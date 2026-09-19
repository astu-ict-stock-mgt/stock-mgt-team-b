import type { NextFunction, Request, Response } from 'express';
import {
  createStockTransfer,
  listStockTransfers,
  getTransferLocations,
  getTransferableItems,
  getItemStockLocations,
} from './service.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export const createTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const {
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      referenceNumber,
    } = req.body;

    const transfer = await createStockTransfer({
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      userId: req.user.id,
      referenceNumber,
    });

    res.status(201).json({
      status: 'success',
      message: 'Stock transferred successfully',
      data: transfer,
      ...transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const listTransfersController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await listStockTransfers();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTransferLocationsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getTransferLocations();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTransferableItemsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getTransferableItems();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getItemStockLocationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { itemId } = req.params;
    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }
    const result = await getItemStockLocations(itemId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};