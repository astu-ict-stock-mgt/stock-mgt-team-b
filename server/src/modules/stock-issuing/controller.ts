import type { NextFunction, Request, Response } from 'express';
import {
  getStockRequisitions,
  createRequisitionService,
  approveRequisitionService,
  rejectRequisitionService,
  issueStock,
} from './service.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export const getRequisitionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const data = await getStockRequisitions();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createRequisitionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { inventoryItemId, warehouseId, quantity, requisitionNumber, justification, isApproved } = req.body;

    const result = await createRequisitionService({
      inventoryItemId,
      warehouseId,
      quantity: Number(quantity) || 1,
      requisitionNumber,
      justification,
      isApproved: Boolean(isApproved),
      userId: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRequisitionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const { id } = req.params;
    const result = await approveRequisitionService(id as string);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const rejectRequisitionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const { id } = req.params;
    const { reason } = req.body;
    const result = await rejectRequisitionService(id as string, reason);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const issueStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { inventoryItemId, warehouseId, quantity, requisitionNumber } = req.body;

    // If issuing from route /:id/issue, find the requisition details
    const result = await issueStock({
      inventoryItemId: inventoryItemId || '',
      warehouseId: warehouseId || '',
      quantity: Number(quantity) || 1,
      requisitionNumber: requisitionNumber || (id as string),
      isApproved: true,
      userId: req.user.id,
    });

    res.status(200).json({
      status: 'success',
      message: 'Stock issued successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
