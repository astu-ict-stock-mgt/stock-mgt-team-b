import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import { createTransfer } from './controller.ts';
import { validateStockTransfer } from './validation.ts';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  validateStockTransfer,
  createTransfer,
);

export default router;