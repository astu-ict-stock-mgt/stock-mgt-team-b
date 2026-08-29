import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createWriteOffController,
  getWriteOffsController,
  getWriteOffByIdController,
  approveWriteOffController,
  rejectWriteOffController,
  disposeWriteOffController,
} from './controller.ts';
import {
  validateCreateWriteOff,
  validateWriteOffId,
  validateRejectWriteOff,
  validateListWriteOffs,
} from './validation.ts';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'),
  validateCreateWriteOff,
  createWriteOffController
);

router.get(
  '/',
  validateListWriteOffs,
  getWriteOffsController
);

router.get(
  '/:id',
  validateWriteOffId,
  getWriteOffByIdController
);

router.put(
  '/:id/approve',
  requireRole('ADMINISTRATOR', 'PAO', 'STOREKEEPER'),
  validateWriteOffId,
  approveWriteOffController
);

router.put(
  '/:id/reject',
  requireRole('ADMINISTRATOR', 'PAO', 'STOREKEEPER'),
  validateRejectWriteOff,
  rejectWriteOffController
);

router.put(
  '/:id/dispose',
  requireRole('ADMINISTRATOR', 'PAO', 'STOREKEEPER'),
  validateWriteOffId,
  disposeWriteOffController
);

export default router;
