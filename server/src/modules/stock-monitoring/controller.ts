import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import {
  getStockLevels,
  getItemStockLevel,
  getStockAlerts,
  getStockSummaryStats,
} from './service.ts';

export const getStockMonitoring = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { warehouseId } = req.query;
    const result = await getStockLevels(warehouseId as string | undefined);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getItemMonitoring = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { itemId } = req.params;
    const { warehouseId } = req.query;

    if (!itemId || typeof itemId !== 'string') {
      throw new AppError('Item ID is required and must be a string', 400);
    }

    const result = await getItemStockLevel(itemId, warehouseId as string | undefined);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockAlertsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { search, severity, category, warehouse } = req.query;
    const data = await getStockAlerts({
      search: search as string | undefined,
      severity: severity as string | undefined,
      category: category as string | undefined,
      warehouse: warehouse as string | undefined,
    });

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummaryStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const stats = await getStockSummaryStats();

    res.status(200).json({
      status: 'success',
      stats,
    });
  } catch (error) {
    next(error);
  }
};

