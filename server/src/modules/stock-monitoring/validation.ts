import { query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateGetStockLevels = [
  query('warehouseId')
    .optional()
    .isString()
    .isUUID()
    .withMessage('warehouseId must be a valid UUID'),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(
        new AppError(errors.array()[0].msg, 400)
      );
      return;
    }
    next();
  },
];

export const validateGetItemStockLevel = [
  query('warehouseId')
    .optional()
    .isString()
    .isUUID()
    .withMessage('warehouseId must be a valid UUID'),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(
        new AppError(errors.array()[0].msg, 400)
      );
      return;
    }
    next();
  },
];
