import { Request, Response, NextFunction } from 'express';

export const validateCreateSupplier = (req: Request, res: Response, next: NextFunction): any => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Supplier name field parameter is mandatory.' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Provided supplier email address formatting is invalid.' });
  }

  if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Provided supplier phone string formatting is invalid.' });
  }

  next();
};
