import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  approveReconciliationHandler,
  completeStockTakeHandler,
  createStockTakeHandler,
  getReconciliationsHandler,
  getStockTakeHandler,
  rejectReconciliationHandler,
  submitCountHandler,
} from './controller.ts';
import {
  validateCreateStockTake,
  validateReconciliationAction,
  validateSessionId,
  validateSubmitCount,
} from './validation.ts';

const operationalRoles = ['STOREKEEPER', 'STOCK_CLERK', 'PAO'] as const;
const viewRoles = [
  'ADMINISTRATOR',
  'PAO',
  'STOREKEEPER',
  'STOCK_CLERK',
  'ACCOUNTANT',
  'DEPARTMENT_HEAD',
] as const;

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(...operationalRoles),
  validateCreateStockTake,
  createStockTakeHandler
);
router.post(
  '/:sessionId/counts',
  requireAuth,
  requireRole(...operationalRoles),
  validateSubmitCount,
  submitCountHandler
);
router.get(
  '/:sessionId',
  requireAuth,
  requireRole(...viewRoles),
  validateSessionId,
  getStockTakeHandler
);
router.post(
  '/:sessionId/complete',
  requireAuth,
  requireRole(...operationalRoles),
  validateSessionId,
  completeStockTakeHandler
);
router.get(
  '/:sessionId/reconciliations',
  requireAuth,
  requireRole(...viewRoles),
  validateSessionId,
  getReconciliationsHandler
);
router.post(
  '/reconciliations/:reconciliationId/approve',
  requireAuth,
  requireRole('PAO', 'ADMINISTRATOR'),
  validateReconciliationAction,
  approveReconciliationHandler
);
router.post(
  '/reconciliations/:reconciliationId/reject',
  requireAuth,
  requireRole('PAO', 'ADMINISTRATOR'),
  validateReconciliationAction,
  rejectReconciliationHandler
);

export default router;