import { Router } from 'express';
import { getAuditLogsHandler } from './controller.ts';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';

const router = Router();

// Retrieve all audit logs (accessible to Administrator, PAO, and Accountant)
router.get(
  '/',
  requireAuth,
  requireRole('ADMINISTRATOR', 'PAO', 'ACCOUNTANT'),
  getAuditLogsHandler
);

export default router;
