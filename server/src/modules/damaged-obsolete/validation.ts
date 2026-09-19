import { body, param, query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

const handleValidation = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation error', 400));
    return;
  }
  next();
};

export const validateCreateWriteOff = [
  body('itemId').isString().trim().notEmpty().withMessage('itemId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reasonCode')
    .isString()
    .isIn(['DAMAGED', 'OBSOLETE', 'EXPIRED', 'OTHER'])
    .withMessage('Valid reasonCode is required (DAMAGED, OBSOLETE, EXPIRED, OTHER)'),
  body('reasonDescription').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  handleValidation,
];

export const validateWriteOffId = [
  param('id').isString().trim().notEmpty().withMessage('Valid write-off id is required'),
  handleValidation,
];

export const validateGetWriteOff = [
  query('status')
    .optional()
    .isString()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'DISPOSED', 'ALL'])
    .withMessage('Invalid status filter'),
  handleValidation,
];

export const validateRejectWriteOff = [
  param('id').isString().trim().notEmpty().withMessage('Valid write-off id is required'),
  body('reason').optional().isString().trim(),
  handleValidation,
];
