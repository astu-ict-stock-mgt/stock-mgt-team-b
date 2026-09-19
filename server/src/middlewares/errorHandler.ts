import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('Route not found', 404));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  // Server-side logging for diagnostics
  if (statusCode >= 500) {
    console.error(`[Server Error] ${err.name || 'Error'}: ${err.message}`);
    const anyErr = err as { code?: string; meta?: unknown; cause?: unknown };
    if (anyErr.code) console.error(`[Server Error Code]: ${anyErr.code}`);
    if (anyErr.meta) console.error(`[Server Error Meta]:`, anyErr.meta);
    if (anyErr.cause) console.error(`[Server Error Cause]:`, anyErr.cause);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // Sanitize user-facing message:
  // Non-technical users should never see raw database traces, file paths, or internal driver errors.
  let message: string;

  const rawMsg = err.message || '';
  const errCode = ((err as { code?: string }).code || '').toUpperCase();
  const isPrismaOrDbInternal =
    (err.name && err.name.includes('Prisma')) ||
    rawMsg.toLowerCase().includes('prisma') ||
    rawMsg.includes('invocation in') ||
    rawMsg.includes('databaseUrl') ||
    rawMsg.includes('/server/src') ||
    errCode === 'ETIMEDOUT' ||
    errCode === 'ECONNREFUSED' ||
    errCode === 'EAI_AGAIN' ||
    rawMsg.includes('ETIMEDOUT') ||
    rawMsg.includes('getaddrinfo');

  if (isPrismaOrDbInternal) {
    message = 'Database service is temporarily unavailable. Please try again in a moment.';
  } else if (isAppError || process.env.NODE_ENV !== 'production') {
    message = err.message || 'Internal Server Error';
  } else {
    message = 'An unexpected server error occurred. Please try again or contact your administrator.';
  }

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};
