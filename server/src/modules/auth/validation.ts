import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';

export const validateLogin = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      next(new AppError(errors.array()[0]?.msg ?? 'Invalid login request', 400));
      return;
    }

    next();
  },
];
