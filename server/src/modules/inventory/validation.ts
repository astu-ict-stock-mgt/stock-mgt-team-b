import { body, param, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

// Common utility to format and throw validation failures cleanly
const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const primaryMessage = errors.array()[0]?.msg ?? 'Invalid request parameters';
    next(new AppError(primaryMessage, 400));
    return;
  }
  next();
};

// 1. Enforces rules when creating a new physical Item
export const validateCreateItem = [
  body('itemCode')
    .isString().withMessage('itemCode must be a string')
    .trim().notEmpty().withMessage('itemCode is required and cannot be empty'),
  body('name')
    .isString().withMessage('name must be a string')
    .trim().notEmpty().withMessage('name is required and cannot be empty'),
  body('description')
    .optional().isString().withMessage('description must be a string').trim(),
  body('state')
    .optional().isString().withMessage('state must be a valid status string'),
  body('categoryId')
    .isString().notEmpty().withMessage('categoryId is required'),
  body('warehouseId')
    .isString().notEmpty().withMessage('warehouseId is required'),
  handleValidationErrors
];

// 2. Enforces rules when appending a new historical Batch Lot
export const validateCreateStockLot = [
  param('itemId')
    .isString().notEmpty().withMessage('Valid parent itemId path parameter is required'),
  body('quantityReceived')
    .isInt({ min: 1 }).withMessage('quantityReceived must be an integer greater than 0'),
  body('quantityRemaining')
    .isInt({ min: 0 }).withMessage('quantityRemaining must be a positive integer'),
  body('unitCost')
    .isFloat({ min: 0.01 }).withMessage('unitCost must be a positive floating-point number'),
  body('receivedDate')
    .isISO8601().toDate().withMessage('receivedDate must be a valid ISO8601 datetime format'),
  handleValidationErrors
];

// 3. Enforces parameters when updating item metadata details
export const validateUpdateItem = [
  param('itemId').isString().notEmpty().withMessage('Item ID parameter is required'),
  body('itemCode').optional().isString().trim().notEmpty().withMessage('itemCode cannot be blank'),
  body('name').optional().isString().trim().notEmpty().withMessage('name cannot be blank'),
  body('description').optional().isString().trim(),
  body('state').optional().isString(),
  handleValidationErrors
];

// 4. Enforces parameters when adjusting a specific stock lot batch line
export const validateUpdateStockLot = [
  param('itemId').isString().notEmpty().withMessage('Item ID parameter is required'),
  param('lotId').isString().notEmpty().withMessage('Lot ID parameter is required'),
  body('quantityRemaining').optional().isInt({ min: 0 }).withMessage('quantityRemaining must be a positive integer'),
  body('unitCost').optional().isFloat({ min: 0.01 }).withMessage('unitCost must be a positive number'),
  body('isDepleted').optional().isBoolean().withMessage('isDepleted must be a valid boolean true/false'),
  handleValidationErrors
];

// 5. Parameter gatekeeper for generic singular asset lookup identifiers
export const validateItemParams = [
  param('itemId').isString().notEmpty().withMessage('Target Inventory Item ID parameter is missing'),
  handleValidationErrors
];

// 6. Parameter gatekeeper for compound item + batch lookup routines
export const validateLotParams = [
  param('itemId').isString().notEmpty().withMessage('Target Inventory Item ID parameter is missing'),
  param('lotId').isString().notEmpty().withMessage('Target Stock Lot ID parameter is missing'),
  handleValidationErrors
];
