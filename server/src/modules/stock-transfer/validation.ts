import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateStockTransfer = [
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('itemId is required'),

  body('fromWarehouseId')
    .trim()
    .notEmpty()
    .withMessage('fromWarehouseId is required'),

  body('toWarehouseId')
    .trim()
    .notEmpty()
    .withMessage('toWarehouseId is required'),

  body('toWarehouseId').custom((toWarehouseId, { req }) => {
    if (toWarehouseId === req.body.fromWarehouseId) {
      throw new Error(
        'Source and destination warehouses must be different',
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
    .isString()
    .withMessage('referenceNumber must be a string')
    .trim(),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0].msg, 400));
      return;
    }

    next();
  },
];