import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.ts';

export const ROLES = [
  'ADMINISTRATOR',
  'PAO',
  'STOREKEEPER',
  'STOCK_CLERK',
  'ACCOUNTANT',
  'DEPARTMENT_HEAD',
  'SECURITY_OFFICER',
] as const;

export type Role = (typeof ROLES)[number];

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT_SECRET must be configured', 500);
  }

  return secret;
};

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      !isRole(payload.role)
    ) {
      throw new Error('Invalid token payload');
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRole = (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
