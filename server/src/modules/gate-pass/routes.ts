import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  getPendingOutboundHandler,
  getPendingInboundHandler,
  clearOutboundHandler,
  clearInboundHandler,
  flagDiscrepancyHandler,
  getGatePassHistoryHandler,
  verifyReferenceHandler,
} from './controller.ts';
import {
  validateClearOutbound,
  validateClearInbound,
  validateFlagDiscrepancy,
  validateVerifyReference,
  validateHistoryQuery,
} from './validation.ts';

const router = Router();

router.use(requireAuth);

// Pending dispatch & delivery queues
router.get(
  '/pending-outbound',
  requireRole('SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR'),
  getPendingOutboundHandler
);

router.get(
  '/pending-inbound',
  requireRole('SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR'),
  getPendingInboundHandler
);

// Quick Gate Verification / Scanner Lookup
router.get(
  '/verify/:reference',
  requireRole('SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR'),
  validateVerifyReference,
  verifyReferenceHandler
);

// Clearance History
router.get(
  '/history',
  requireRole('SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR'),
  validateHistoryQuery,
  getGatePassHistoryHandler
);

// Actions: Clearance & Flagging
router.post(
  '/clear-outbound',
  requireRole('SECURITY_OFFICER', 'ADMINISTRATOR', 'STOREKEEPER'),
  validateClearOutbound,
  clearOutboundHandler
);

router.post(
  '/clear-inbound',
  requireRole('SECURITY_OFFICER', 'ADMINISTRATOR', 'STOREKEEPER'),
  validateClearInbound,
  clearInboundHandler
);

router.post(
  '/flag',
  requireRole('SECURITY_OFFICER', 'ADMINISTRATOR', 'STOREKEEPER'),
  validateFlagDiscrepancy,
  flagDiscrepancyHandler
);

export default router;

