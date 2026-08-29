import type { NextFunction, Request, Response } from 'express';
import { createStockTransfer } from './service.ts';
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
    });
  } catch (error) {
    next(error);
  }
};