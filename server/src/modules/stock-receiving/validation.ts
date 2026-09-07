import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

// Stage 1 validation: creating a DRAFT GRN (no inspection required at this stage)
export const validateCreateReceiving = [
  body('supplierId').isString().notEmpty().withMessage('Supplier is required'),
  body('warehouseId').isString().notEmpty().withMessage('Warehouse is required'),
  body('receivedDate').optional().isISO8601().withMessage('receivedDate must be a valid date'),
  body('lineItems').isArray({ min: 1 }).withMessage('At least one receiving item is required'),
  body('lineItems.*.itemId').isString().notEmpty().withMessage('itemId is required'),
  body('lineItems.*.quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1'),
  body('lineItems.*.unitCost').isFloat({ min: 0 }).withMessage('unitCost must be zero or greater'),

  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0]?.msg ?? 'Invalid receiving request', 400));
      return;
    }
    next();
  },
];
