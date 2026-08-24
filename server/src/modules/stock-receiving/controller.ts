import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import { createReceiving } from './service.ts';

export const createReceivingNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supplierId, warehouseId, receivedDate, items } = req.body;

    // Check authorization using your team's template check rules
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Call your team's pre-configured service function
    const result = await createReceiving(
      {
        supplierId,
        warehouseId,
        receivedDate,
        items,
      },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Goods Receiving Note and Items created successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};