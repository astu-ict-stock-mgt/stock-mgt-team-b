import type { NextFunction, Request, Response } from 'express';
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
} from './service.ts';

export const getSuppliersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isActive =
      typeof req.query.isActive === 'string'
        ? req.query.isActive === 'true'
        : undefined;
    const suppliers = await getSuppliers({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      isActive,
    });

    res.status(200).json({ status: 'success', data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const getSupplierByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await getSupplierById(req.params.id as string);
    res.status(200).json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
};

export const createSupplierHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await createSupplier(req.body);
    res.status(201).json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await updateSupplier(req.params.id as string, req.body);
    res.status(200).json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplierHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteSupplier(req.params.id as string);
    res.status(200).json({
      status: 'success',
      message: result.deactivated
        ? 'Supplier deactivated because it has stock history'
        : 'Supplier deleted successfully',
      data: result.supplier,
    });
  } catch (error) {
    next(error);
  }
};
