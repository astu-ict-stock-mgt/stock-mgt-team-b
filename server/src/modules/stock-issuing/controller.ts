import type { NextFunction, Request, Response } from 'express';
import {
  issueStock,
  createRequisition,
  getRequisitions,
  getRequisitionById,
  approveRequisition,
  rejectRequisition,
  issueRequisition,
  getIssueHistory,
  getIssuingItems,
} from './service.ts';
import { AppError } from '../../middlewares/errorHandler.ts';

export const issueStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { inventoryItemId, warehouseId, quantity, requisitionNumber, isApproved } = req.body;

    const result = await issueStock({
      inventoryItemId,
      warehouseId,
      quantity,
      requisitionNumber,
      isApproved,
      userId: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Stock issued successfully',
      data: result,
    });
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
    const userId = req.user?.id ?? 'system';
    const result = await createRequisition(req.body, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRequisitionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const result = await getRequisitions(status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRequisitionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getRequisitionById(id);
    res.status(200).json(result);
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
    const { id } = req.params;
    const approverId = req.user?.id ?? 'system';
    const result = await approveRequisition(id, approverId);
    res.status(200).json(result);
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
    const { id } = req.params;
    const approverId = req.user?.id ?? 'system';
    const { reason } = req.body;
    const result = await rejectRequisition(id, approverId, reason);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const issueRequisitionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const issuerId = req.user?.id ?? 'system';
    const warehouseId = req.body.warehouseId as string | undefined;
    const result = await issueRequisition(id, issuerId, warehouseId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getIssueHistoryController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getIssueHistory();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getIssuingItemsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getIssuingItems();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

