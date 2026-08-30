import { body, param, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Invalid stock-taking request', 400));
    return;
  }
  next();
};

export const validateSessionId = [
  param('sessionId').isString().trim().notEmpty().withMessage('sessionId is required'),
  handleValidationErrors,
];

export const validateCreateStockTake = [
  body('warehouseId').isString().trim().notEmpty().withMessage('warehouseId is required'),
  handleValidationErrors,
];

export const validateSubmitCount = [
  param('sessionId').isString().trim().notEmpty().withMessage('sessionId is required'),
  body('inventoryItemId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('inventoryItemId is required'),
  body('physicalQuantity')
    .isInt({ min: 0 })
    .withMessage('physicalQuantity must be a non-negative integer'),
  handleValidationErrors,
];

export const validateReconciliationAction = [
  param('reconciliationId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('reconciliationId is required'),
  body('reason').isString().trim().notEmpty().withMessage('reason is required'),
  body('unitCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('unitCost must be zero or greater'),
  handleValidationErrors,
];