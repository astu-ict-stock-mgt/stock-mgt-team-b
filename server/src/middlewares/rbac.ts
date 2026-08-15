import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.ts';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
}

// Middleware 1: Enforce valid user login token
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Unauthorized: Missing or invalid token', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as DecodedToken;
    (req as any).user = decoded; // Attach user payload metadata to the request object
    next();
  } catch (error) {
    throw new AppError('Unauthorized: Missing or invalid token', 401);
  }
};

// Middleware 2: Enforce role access control rules for the 7 system roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role)) {
      throw new AppError('Forbidden: Unauthorized role access', 403);
    }
    
    next();
  };
};
