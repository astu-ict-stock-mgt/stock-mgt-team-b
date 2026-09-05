import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import {
  getPendingOutboundDispatches,
  getPendingInboundDeliveries,
  clearOutboundGatePass,
  clearInboundGatePass,
  flagGateDiscrepancy,
  getGatePassHistory,
  verifyGateReference,
} from './service.ts';

export const getPendingOutboundHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dispatches = await getPendingOutboundDispatches();
    res.status(200).json(dispatches);
  } catch (error) {
    next(error);
  }
};

export const getPendingInboundHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deliveries = await getPendingInboundDeliveries();
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

export const clearOutboundHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const gatePass = await clearOutboundGatePass(req.body, req.user.id);
    res.status(201).json(gatePass);
  } catch (error) {
    next(error);
  }
};

export const clearInboundHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const gatePass = await clearInboundGatePass(req.body, req.user.id);
    res.status(201).json(gatePass);
  } catch (error) {
    next(error);
  }
};

export const flagDiscrepancyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const record = await flagGateDiscrepancy(req.body, req.user.id);
    res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

export const getGatePassHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { direction, status, query } = req.query as {
      direction?: 'OUTBOUND' | 'INBOUND';
      status?: 'CLEARED' | 'FLAGGED';
      query?: string;
    };
    const history = await getGatePassHistory({ direction, status, query });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

export const verifyReferenceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reference = req.params.reference;
    if (!reference) {
      throw new AppError('Reference number parameter is required', 400);
    }
    const result = await verifyGateReference(reference);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

