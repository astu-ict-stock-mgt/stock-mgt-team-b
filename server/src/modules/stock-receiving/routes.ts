import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createReceivingNote,
  getReceivingNotesController,
  getReceivingNoteByIdController,
  sendToInspectionController,
  submitInspectionController,
  confirmRoutingController,
  paoApproveController,
  paoRejectController,
} from './controller.ts';
import { validateCreateReceiving } from './validation.ts';

const router = Router();

router.use(requireAuth);

// ── GET all GRNs (optionally filtered by ?status=DRAFT etc.) ─────────────────
router.get('/', getReceivingNotesController);

// ── GET single GRN ───────────────────────────────────────────────────────────
router.get('/:id', getReceivingNoteByIdController);

// ── Stage 1: Storekeeper / Stock Clerk creates a DRAFT GRN ──────────────────
router.post(
  '/',
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR'),
  validateCreateReceiving,
  createReceivingNote
);

// ── Stage 2: Storekeeper sends to Technical Inspection ──────────────────────
router.put(
  '/:id/send-to-inspection',
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  sendToInspectionController
);

// ── Stage 3: Stock Clerk (Technical Inspector) submits inspection report ─────
router.put(
  '/:id/inspect',
  requireRole('STOCK_CLERK', 'STOREKEEPER', 'ADMINISTRATOR'),
  submitInspectionController
);

// ── Stage 4: Storekeeper confirms routing (good→store, damaged→damaged store) ─
router.put(
  '/:id/confirm-routing',
  requireRole('STOREKEEPER', 'ADMINISTRATOR'),
  confirmRoutingController
);

// ── Stage 5a: PAO approves → commits stock to inventory ─────────────────────
router.put(
  '/:id/approve',
  requireRole('PAO', 'ADMINISTRATOR'),
  paoApproveController
);

// ── Stage 5b: PAO rejects ────────────────────────────────────────────────────
router.put(
  '/:id/reject',
  requireRole('PAO', 'ADMINISTRATOR'),
  paoRejectController
);

export default router;
