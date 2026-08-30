import { Router } from 'express';

import authRoutes from '../modules/auth/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';
import inventoryRoutes from '../modules/inventory/routes.ts';
import reportsRoutes from '../modules/reports/routes.ts';
import stockIssuingRoutes from '../modules/stock-issuing/routes.ts';
import stockTakingRoutes from '../modules/stock-taking/routes.ts';
import usersRoutes from '../modules/users/routes.ts';
import suppliersRoutes from '../modules/suppliers/routes.ts';
import auditLogRoutes from '../modules/audit-log/routes.ts';
import stockTransferRoutes from '../modules/stock-transfer/routes.ts';
import stockMonitoringRoutes from '../modules/stock-monitoring/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stock-receiving', stockReceivingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);
router.use('/stock-issuing', stockIssuingRoutes);
router.use('/stock-taking', stockTakingRoutes);
router.use('/stock-monitoring', stockMonitoringRoutes);
router.use('/users', usersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/stock-transfers', stockTransferRoutes);

export default router;
