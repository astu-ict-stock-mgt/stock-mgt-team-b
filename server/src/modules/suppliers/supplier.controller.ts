import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service.ts';

const supplierService = new SupplierService();

export const handleCreateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, contactName, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name field parameter is mandatory.' });
    }

    const result = await supplierService.createSupplier({ name, contactName, email, phone, address });
    return res.status(201).json({ success: true, message: 'Supplier registered seamlessly.', data: result });
  } catch (error) {
    next(error);
  }
};

export const handleGetSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await supplierService.getAllSuppliers();
    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};