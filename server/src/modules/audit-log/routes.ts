import { Router } from 'express';
import { getAuditLogsHandler } from './controller.ts';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';

const router = Router();

// Retrieve all audit logs (only for Administrator or specific roles)
router.get(
  '/',
  requireAuth,
  requireRole('ADMINISTRATOR'),
  getAuditLogsHandler
);

export default router;
