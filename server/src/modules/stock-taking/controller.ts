import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import {
  completeStockTake,
  createStockTake,
  getAllReconciliations,
  getReconciliations,
  getStockTake,
  getWarehouseWorksheet,
  listStockTakes,
  approveReconciliation,
  rejectReconciliation,
  submitStockTakeCount,
} from './service.ts';

const requireUser = (req: Request): string => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user.id;
};

export const listStockTakesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouseId = typeof req.query.warehouseId === 'string' ? req.query.warehouseId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const data = await listStockTakes({ warehouseId, status });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseWorksheetHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getWarehouseWorksheet(req.params.sessionId!);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getAllReconciliationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const data = await getAllReconciliations(status);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createStockTakeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await createStockTake({ warehouseId: req.body.warehouseId, createdBy: requireUser(req) });
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const submitCountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await submitStockTakeCount({
      sessionId: req.params.sessionId!,
      inventoryItemId: req.body.inventoryItemId,
      physicalQuantity: req.body.physicalQuantity,
      countedBy: requireUser(req),
    });
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getStockTakeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ status: 'success', data: await getStockTake(req.params.sessionId!) });
  } catch (error) {
    next(error);
  }
};

export const completeStockTakeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      status: 'success',
      data: await completeStockTake(req.params.sessionId!),
    });
  } catch (error) {
    next(error);
  }
};

export const getReconciliationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      status: 'success',
      data: await getReconciliations(req.params.sessionId!),
    });
  } catch (error) {
    next(error);
  }
};

export const approveReconciliationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await approveReconciliation({
      reconciliationId: req.params.reconciliationId!,
      reason: req.body.reason,
      unitCost: req.body.unitCost,
      approvedBy: requireUser(req),
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const rejectReconciliationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await rejectReconciliation({
      reconciliationId: req.params.reconciliationId!,
      reason: req.body.reason,
      approvedBy: requireUser(req),
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
