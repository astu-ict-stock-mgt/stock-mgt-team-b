import { Router } from 'express';

import inventoryRoutes from '../modules/inventory/routes.ts';
import reportsRoutes from '../modules/reports/routes.ts';
import stockIssuingRoutes from '../modules/stock-issuing/routes.ts';
import stockTakingRoutes from '../modules/stock-taking/routes.ts';
import authRoutes from '../modules/auth/routes.ts';
import usersRoutes from '../modules/users/routes.ts';
import suppliersRoutes from '../modules/suppliers/routes.ts';
import auditLogRoutes from '../modules/audit-log/routes.ts';
import stockTransferRoutes from '../modules/stock-transfer/routes.ts';

const router = Router();

router.use('/reports', reportsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stock-issuing', stockIssuingRoutes);
router.use('/stock-taking', stockTakingRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/stock-transfers', stockTransferRoutes);

export default router;