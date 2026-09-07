import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  approveReconciliationHandler,
  completeStockTakeHandler,
  createStockTakeHandler,
  getAllReconciliationsHandler,
  getReconciliationsHandler,
  getStockTakeHandler,
  getWarehouseWorksheetHandler,
  listStockTakesHandler,
  rejectReconciliationHandler,
  submitCountHandler,
} from './controller.ts';
import {
  validateCreateStockTake,
  validateReconciliationAction,
  validateSessionId,
  validateSubmitCount,
} from './validation.ts';

const operationalRoles = ['STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR'] as const;
const viewRoles = [
  'ADMINISTRATOR',
  'PAO',
  'STOREKEEPER',
  'STOCK_CLERK',
  'ACCOUNTANT',
  'DEPARTMENT_HEAD',
] as const;

const router = Router();

// Sessions collection
router.get(
  '/',
  requireAuth,
  requireRole(...viewRoles),
  listStockTakesHandler
);

router.post(
  '/',
  requireAuth,
  requireRole(...operationalRoles),
  validateCreateStockTake,
  createStockTakeHandler
);

// Global Reconciliations routes (MUST precede /:sessionId to avoid param collision)
router.get(
  '/reconciliations',
  requireAuth,
  requireRole(...viewRoles),
  getAllReconciliationsHandler
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

// Individual session routes
router.get(
  '/:sessionId',
  requireAuth,
  requireRole(...viewRoles),
  validateSessionId,
  getStockTakeHandler
);

router.get(
  '/:sessionId/worksheet',
  requireAuth,
  requireRole(...viewRoles),
  validateSessionId,
  getWarehouseWorksheetHandler
);

router.post(
  '/:sessionId/counts',
  requireAuth,
  requireRole(...operationalRoles),
  validateSubmitCount,
  submitCountHandler
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

export default router;