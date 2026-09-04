import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createTransfer,
  listTransfersController,
  getTransferLocationsController,
} from './controller.ts';
import { validateStockTransfer } from './validation.ts';

const router = Router();

router.use(requireAuth);

router.get('/', listTransfersController);

router.get('/locations', getTransferLocationsController);

router.post(
  '/',
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  validateStockTransfer,
  createTransfer,
);

export default router;