import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createReceivingNote,
  listReceivingNotesHandler,
  getReceivingNoteByIdHandler,
} from './controller.ts';
import { validateCreateReceiving } from './validation.ts';

const router = Router();

router.use(requireAuth);

router.get('/', listReceivingNotesHandler);

router.get('/:id', getReceivingNoteByIdHandler);

router.post(
  '/',
  requireRole('STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR'),
  validateCreateReceiving,
  createReceivingNote
);

export default router;
