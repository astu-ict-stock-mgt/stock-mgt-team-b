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
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return;
  }

  next();
};

const supplierFields = [
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Supplier name cannot be empty'),
  body('contactName').optional({ nullable: true }).isString().trim(),
  body('phone').optional({ nullable: true }).isString().trim(),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('address').optional({ nullable: true }).isString().trim(),
];

export const validateCreateSupplier = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required'),
  ...supplierFields.slice(1),
  handleValidationErrors,
];

export const validateUpdateSupplier = [
  param('id').isUUID().withMessage('Invalid supplier ID format'),
  ...supplierFields,
  handleValidationErrors,
];

export const validateSupplierId = [
  param('id').isUUID().withMessage('Invalid supplier ID format'),
  handleValidationErrors,
];

export const validateGetSuppliersQuery = [
  query('search').optional().isString().trim(),
  query('isActive').optional().isBoolean().withMessage('isActive filter must be boolean'),
  handleValidationErrors,
];
