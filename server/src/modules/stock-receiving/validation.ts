import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateCreateReceiving = [
  
body('supplierId')
    .isString()
    .notEmpty()
    .withMessage('Supplier is required'),

  body('warehouseId')
    .isString()
    .notEmpty()
    .withMessage('Warehouse is required'),

  body('receivedDate')
    .optional()
    .isISO8601()
    .withMessage('receivedDate must be a valid date'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one receiving item is required'),

  body('items.*.inventoryItemId')
    .isString()
    .notEmpty()
    .withMessage('inventoryItemId is required'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('quantity must be greater than zero'),

  body('items.*.unitCost')
    .isFloat({ min: 0 })
    .withMessage('unitCost must be zero or greater'),

  body('items.*.inspectionStatus')
    .isIn(['ACCEPTED', 'REJECTED'])
    .withMessage('inspectionStatus must be ACCEPTED or REJECTED'),

  body('items.*.rejectionReason')
    .optional()
    .isString()
    .trim(),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0]?.msg ?? 'Invalid receiving request', 400));
      return;
    }

    next();
  },
];
