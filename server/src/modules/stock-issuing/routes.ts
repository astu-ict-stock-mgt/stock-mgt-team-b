import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import { validateIssueStock } from './validation.ts';
import { issueStockController } from './controller.ts';

const router = Router();

router.post('/', requireAuth, requireRole('STOREKEEPER', 'ADMINISTRATOR'), validateIssueStock, issueStockController);

export default router;
