import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateIssueStock = [
  body('inventoryItemId').isUUID().withMessage('Valid inventoryItemId is required'),
  body('warehouseId').isUUID().withMessage('Valid warehouseId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('requisitionNumber').isString().trim().notEmpty().withMessage('requisitionNumber is required'),
  body('isApproved').isBoolean().withMessage('isApproved boolean flag is required'),
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0]?.msg ?? 'Invalid stock issue request', 400));
      return;
    }
    next();
  },
];
