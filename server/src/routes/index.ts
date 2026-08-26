import { Router } from 'express';

import reportsRoutes from '../modules/reports/routes.ts';
import authRoutes from '../modules/auth/routes.ts';
import usersRoutes from '../modules/users/routes.ts';
import stockTransferRoutes from '../modules/stock-transfer/routes.ts';

const router = Router();

router.use('/reports', reportsRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/stock-transfers', stockTransferRoutes);

export default router;