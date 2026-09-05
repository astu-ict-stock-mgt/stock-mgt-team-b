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
import stockMonitoringRoutes from '../modules/stock-monitoring/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';
import writeOffRoutes from '../modules/damaged-obsolete/routes.ts';
import { getInventoryWarehouses } from '../modules/inventory/service.ts';

const router = Router();

router.use('/reports', reportsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/items', inventoryRoutes);
router.use('/stock-issuing', stockIssuingRoutes);
router.use('/stock-taking', stockTakingRoutes);
router.use('/stock-monitoring', stockMonitoringRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/stock-transfers', stockTransferRoutes);
router.use('/stock-transfer', stockTransferRoutes);
router.use('/stock-receiving', stockReceivingRoutes);
router.use('/grns', stockReceivingRoutes);
router.use('/write-off', writeOffRoutes);
router.use('/damaged-obsolete', writeOffRoutes);

router.get('/warehouses', async (_req, res, next) => {
  try {
    const warehouses = await getInventoryWarehouses();
    res.status(200).json(warehouses);
  } catch (err) {
    next(err);
  }
});

export default router;