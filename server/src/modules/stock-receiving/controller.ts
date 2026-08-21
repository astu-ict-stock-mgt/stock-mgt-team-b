import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import { createReceiving } from './service.ts';

export const createReceivingNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await createReceiving(req.body, req.user.id);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
