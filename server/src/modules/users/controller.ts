import type { NextFunction, Request, Response } from 'express';
import {
  createUser,
  deactivateUser,
  getUserById,
  getUsers,
  updateUser,
} from './service.ts';
import type { Role } from '../../middlewares/rbac.ts';

export const getUsersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;
    const users = await getUsers({
      role: role as Role | undefined,
      isActive: isActive as string | undefined,
      search: search as string | undefined,
    });
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserById(id as string);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

export const createUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.id ?? '';
    const user = await createUser(req.body, adminId);
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id ?? '';
    const user = await updateUser(id as string, req.body, adminId);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

export const deactivateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id ?? '';
    const user = await deactivateUser(id as string, adminId);
    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
