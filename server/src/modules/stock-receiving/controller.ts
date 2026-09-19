import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler.ts';
import { createReceiving, listReceivingNotes, getReceivingNoteById } from './service.ts';

export const createReceivingNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await createReceiving(req.body, req.user.id);

    res.status(201).json({
      status: 'success',
      data: result,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const listReceivingNotesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    const result = await listReceivingNotes({ page, limit, search });

    if (req.query.format === 'paginated') {
      res.status(200).json({ status: 'success', ...result });
    } else {
      res.status(200).json(result.data);
    }
  } catch (error) {
    next(error);
  }
};

export const getReceivingNoteByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getReceivingNoteById(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
