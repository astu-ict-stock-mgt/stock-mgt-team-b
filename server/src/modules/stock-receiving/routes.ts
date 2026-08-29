import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createReceivingNote,
  getReceivingNotesController,
  getReceivingNoteByIdController,
} from './controller.ts';
import { validateCreateReceiving } from './validation.ts';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR'),
  validateCreateReceiving,
  createReceivingNote
);

router.get(
  '/',
  getReceivingNotesController
);

router.get(
  '/:id',
  getReceivingNoteByIdController
);

export default router;

