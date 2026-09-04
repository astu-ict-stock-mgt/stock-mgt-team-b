import { query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateGetStockLevels = [
  query('warehouseId')
    .optional()
    .custom((value) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        value === 'warehouse-1' ||
        value === 'warehouse-2' ||
        uuidRegex.test(value)
      ) {
        return true;
      }
      throw new Error('warehouseId must be a valid UUID');
    }),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0].msg, 400));
      return;
    }
    next();
  },
];

export const validateGetItemStockLevel = [
  query('warehouseId')
    .optional()
    .custom((value) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        value === 'warehouse-1' ||
        value === 'warehouse-2' ||
        uuidRegex.test(value)
      ) {
        return true;
      }
      throw new Error('warehouseId must be a valid UUID');
    }),

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
