import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import { validateIssueStock } from './validation.ts';
import {
  issueStockController,
  createRequisitionController,
  getRequisitionsController,
  getRequisitionByIdController,
  approveRequisitionController,
  rejectRequisitionController,
  issueRequisitionController,
  getIssueHistoryController,
  getIssuingItemsController,
} from './controller.ts';

const router = Router();

router.use(requireAuth);

// Items for requisition and issuing
router.get('/items', getIssuingItemsController);

// Direct stock issuing (legacy / direct API)
router.post(
  '/',
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  validateIssueStock,
  issueStockController
);

// Requisitions endpoints
router.get('/requisitions', getRequisitionsController);
router.get('/requisitions/:id', getRequisitionByIdController);

router.post(
  '/requisitions',
  requireRole('DEPARTMENT_HEAD', 'PAO', 'ADMINISTRATOR', 'STOREKEEPER'),
  createRequisitionController
);

router.patch(
  '/requisitions/:id/approve',
  requireRole('PAO', 'DEPARTMENT_HEAD', 'ADMINISTRATOR'),
  approveRequisitionController
);

router.patch(
  '/requisitions/:id/reject',
  requireRole('PAO', 'DEPARTMENT_HEAD', 'ADMINISTRATOR'),
  rejectRequisitionController
);

router.post(
  '/requisitions/:id/issue',
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  issueRequisitionController
);

// Issuing history
router.get('/history', getIssueHistoryController);

export default router;
