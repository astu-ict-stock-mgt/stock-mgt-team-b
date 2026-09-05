import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createTransfer,
  listTransfersController,
  getTransferLocationsController,
  getTransferableItemsController,
  getItemStockLocationsController,
} from './controller.ts';
import { validateStockTransfer } from './validation.ts';

const router = Router();

router.use(requireAuth);

router.get('/', listTransfersController);

router.get('/locations', getTransferLocationsController);
router.get('/items', getTransferableItemsController);
router.get('/item-stock/:itemId', getItemStockLocationsController);

router.post(
  '/',
  requireRole('STOREKEEPER', 'ADMINISTRATOR', 'PAO'),
  validateStockTransfer,
  createTransfer,
);

export default router;