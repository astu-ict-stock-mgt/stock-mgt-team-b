import type { NextFunction, Request, Response } from 'express';
import { issueStock } from './service.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export const issueStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { inventoryItemId, warehouseId, quantity, requisitionNumber, isApproved } = req.body;

    const result = await issueStock({
      inventoryItemId,
      warehouseId,
      quantity,
      requisitionNumber,
      isApproved,
      userId: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Stock issued successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
