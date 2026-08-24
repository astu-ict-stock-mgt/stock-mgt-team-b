import { body, param, query, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import { ROLES } from '../../middlewares/rbac.ts';

const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return;
  }
  next();
};

// Validation schema for creating a new user (enforces required fields and valid system roles)
export const validateCreateUser = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(ROLES).withMessage('Invalid role specified'),
  body('department').optional({ nullable: true }).isString().trim(),
  handleValidationErrors,
];

// Validation schema for updating user profile fields and role
export const validateUpdateUser = [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').optional().isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().isString().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(ROLES).withMessage('Invalid role specified'),
  body('department').optional({ nullable: true }).isString().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

export const validateUserId = [
  param('id').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
];

export const validateGetUsersQuery = [
  query('role').optional().isIn(ROLES).withMessage('Invalid role filter'),
  query('isActive').optional().isBoolean().withMessage('isActive filter must be boolean'),
  handleValidationErrors,
];
