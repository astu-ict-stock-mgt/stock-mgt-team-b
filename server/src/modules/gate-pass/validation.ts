import { body, query, param, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Invalid gate pass request', 400));
    return;
  }
  next();
};

export const validateClearOutbound = [
  body('referenceNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('referenceNumber (SIV or Transfer reference) is required'),
  body('vehiclePlate')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('vehiclePlate is required'),
  body('driverName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('driverName is required'),
  body('destination')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('destination is required'),
  body('remarks').optional().isString().trim(),
  body('sealIntact').optional().isBoolean(),
  handleValidationErrors,
];

export const validateClearInbound = [
  body('referenceNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('referenceNumber (GRN or Delivery Note reference) is required'),
  body('vehiclePlate')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('vehiclePlate is required'),
  body('driverName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('driverName is required'),
  body('supplierName').optional().isString().trim(),
  body('remarks').optional().isString().trim(),
  body('sealIntact').optional().isBoolean(),
  handleValidationErrors,
];

export const validateFlagDiscrepancy = [
  body('referenceNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('referenceNumber is required'),
  body('referenceType')
    .isIn(['SIV', 'TRANSFER', 'GRN'])
    .withMessage('referenceType must be SIV, TRANSFER, or GRN'),
  body('reason')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('reason for flagging is required'),
  body('vehiclePlate').optional().isString().trim(),
  body('driverName').optional().isString().trim(),
  body('remarks').optional().isString().trim(),
  handleValidationErrors,
];

export const validateVerifyReference = [
  param('reference')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('reference parameter is required'),
  handleValidationErrors,
];

export const validateHistoryQuery = [
  query('direction').optional().isIn(['OUTBOUND', 'INBOUND']),
  query('status').optional().isIn(['CLEARED', 'FLAGGED']),
  query('query').optional().isString().trim(),
  handleValidationErrors,
];

