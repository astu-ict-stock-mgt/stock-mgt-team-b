import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import { createReceivingNote } from './controller.ts';
import { validateCreateReceiving } from './validation.ts';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'PAO'),
  validateCreateReceiving,
  createReceivingNote
);

export default router;
