import type { NextFunction, Request, Response } from 'express';
import { login } from './service.ts';

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login({
      email: req.body.email,
      password: req.body.password,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
