import { body, param, query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return;
  }
  next();
};

export const validateReportFilters = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO8601 date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO8601 date'),
  query('warehouseId').optional().isUUID().withMessage('Invalid warehouseId format'),
  query('supplierId').optional().isUUID().withMessage('Invalid supplierId format'),
  query('inventoryItemId').optional().isUUID().withMessage('Invalid inventoryItemId format'),
  query('categoryId').optional().isUUID().withMessage('Invalid categoryId format'),
  query('type')
    .optional()
    .isIn(['RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT'])
    .withMessage('Invalid transaction type filter'),
  query('state').optional().isString().trim(),
  query('search').optional().isString().trim(),
  handleValidationErrors,
];

export const validateExportQuery = [
  query('type')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Report type parameter is required for export'),
  query('format').optional().isIn(['csv', 'json']).withMessage('Format must be either csv or json'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO8601 date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO8601 date'),
  query('warehouseId').optional().isUUID().withMessage('Invalid warehouseId format'),
  query('supplierId').optional().isUUID().withMessage('Invalid supplierId format'),
  query('inventoryItemId').optional().isUUID().withMessage('Invalid inventoryItemId format'),
  handleValidationErrors,
];

export const validateCreateReport = [
  body('name').isString().trim().notEmpty().withMessage('Report name is required'),
  body('type').isString().trim().notEmpty().withMessage('Report type is required'),
  body('parameters').optional().isObject().withMessage('Parameters must be an object'),
  body('fileUrl').optional().isString().trim(),
  handleValidationErrors,
];

export const validateReportId = [
  param('id').isUUID().withMessage('Invalid report ID format'),
  handleValidationErrors,
];
