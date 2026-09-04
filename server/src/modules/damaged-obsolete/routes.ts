import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createWriteOffHandler,
  getWriteOffsHandler,
  getWriteOffByIdHandler,
  approveWriteOffHandler,
  rejectWriteOffHandler,
  disposeWriteOffHandler,
} from './controller.ts';
import {
  validateCreateWriteOff,
  validateWriteOffId,
  validateGetWriteOff,
  validateRejectWriteOff,
} from './validation.ts';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'DEPARTMENT_HEAD', 'PAO', 'ADMINISTRATOR'),
  validateCreateWriteOff,
  createWriteOffHandler
);

router.get('/', validateGetWriteOff, getWriteOffsHandler);

router.get('/:id', validateWriteOffId, getWriteOffByIdHandler);

router.put(
  '/:id/approve',
  requireRole('PAO', 'ADMINISTRATOR'),
  validateWriteOffId,
  approveWriteOffHandler
);

router.put(
  '/:id/reject',
  requireRole('PAO', 'ADMINISTRATOR'),
  validateRejectWriteOff,
  rejectWriteOffHandler
);

router.put(
  '/:id/dispose',
  requireRole('STOREKEEPER', 'PAO', 'ADMINISTRATOR'),
  validateWriteOffId,
  disposeWriteOffHandler
);

export default router;
