import { body, param, query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0].msg, 400));
    return;
  }
  next();
};

export const validateCreateWriteOff = [
  body('itemId').isString().notEmpty().withMessage('itemId is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive integer'),
  body('reasonCode')
    .isIn(['DAMAGED', 'OBSOLETE', 'EXPIRED', 'OTHER'])
    .withMessage('reasonCode must be DAMAGED, OBSOLETE, EXPIRED, or OTHER'),
  body('reasonDescription').optional().isString(),
  body('notes').optional().isString(),
  handleValidationErrors,
];

export const validateWriteOffId = [
  param('id').isUUID().withMessage('Invalid write-off ID format'),
  handleValidationErrors,
];

export const validateRejectWriteOff = [
  param('id').isUUID().withMessage('Invalid write-off ID format'),
  body('reason').optional().isString(),
  handleValidationErrors,
];

export const validateListWriteOffs = [
  query('status')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'DISPOSED'])
    .withMessage('status must be PENDING, APPROVED, REJECTED, or DISPOSED'),
  handleValidationErrors,
];
