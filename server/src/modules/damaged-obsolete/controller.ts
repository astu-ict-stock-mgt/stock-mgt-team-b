import type { NextFunction, Request, Response } from 'express';
import {
  createWriteOff,
  getWriteOffs,
  getWriteOffById,
  approveWriteOff,
  rejectWriteOff,
  disposeWriteOff,
} from './service.ts';

export const createWriteOffHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id ?? 'system';
    const result = await createWriteOff(req.body, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getWriteOffsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const result = await getWriteOffs(status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getWriteOffByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getWriteOffById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const approveWriteOffHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const approverId = req.user?.id ?? 'system';
    const result = await approveWriteOff(req.params.id, approverId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectWriteOffHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rejecterId = req.user?.id ?? 'system';
    const reason = req.body.reason as string | undefined;
    const result = await rejectWriteOff(req.params.id, rejecterId, reason);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const disposeWriteOffHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const disposerId = req.user?.id ?? 'system';
    const result = await disposeWriteOff(req.params.id, disposerId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
