import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  getRequisitionsController,
  createRequisitionController,
  approveRequisitionController,
  rejectRequisitionController,
  issueStockController,
} from './controller.ts';

const router = Router();

// Apply global authentication
router.use(requireAuth);

// 1. Get all requisitions / issue records (All roles)
router.get('/', getRequisitionsController);

// 2. Submit Requisition Request (All authenticated roles can request materials)
router.post(
  '/',
  createRequisitionController
);

// 3. Approve Requisition (Department Head, PAO, Admin)
router.put(
  '/:id/approve',
  requireRole('DEPARTMENT_HEAD', 'PAO', 'ADMINISTRATOR'),
  approveRequisitionController
);

// 4. Reject Requisition (Department Head, PAO, Admin)
router.put(
  '/:id/reject',
  requireRole('DEPARTMENT_HEAD', 'PAO', 'ADMINISTRATOR'),
  rejectRequisitionController
);

// 5. Storekeeper Issues Stock (Storekeeper, Stock Clerk, Admin)
router.post(
  '/:id/issue',
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'ADMINISTRATOR'),
  issueStockController
);

export default router;
