import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from './service.ts';

export const getAuditLogsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getAuditLogs();
    res.status(200).json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
