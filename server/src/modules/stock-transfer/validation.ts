import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateStockTransfer = [
  body('itemId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('itemId is required and must be a non-empty string'),

  body('fromWarehouseId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('fromWarehouseId is required and must be a non-empty string'),

  body('toWarehouseId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('toWarehouseId is required and must be a non-empty string')
    .custom((toWarehouseId, { req }) => {
      if (toWarehouseId === req.body.fromWarehouseId) {
        throw new AppError(
          'Source and destination warehouses must be different',
          400,
        );
      }

      return true;
    }),

  body('quantity')
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive integer')
    .toInt(),

  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('referenceNumber must be a non-empty string if provided'),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0].msg, 400));
      return;
    }

    next();
  },
];