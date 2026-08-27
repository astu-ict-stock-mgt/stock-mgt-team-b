import type { NextFunction, Request, Response } from 'express';
import { getAuditLogs } from './service.ts';

export const getAuditLogsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const logs = await getAuditLogs();

    res.status(200).json({
      status: 'success',
      data: logs,
    });
  } catch (error: unknown) {
    next(error);
  }
};