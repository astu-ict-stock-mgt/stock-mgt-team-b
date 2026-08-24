import { Router } from 'express';
import stockMonitoringRoutes from '../modules/stock-monitoring/stock-monitoring.routes';
import reportsRoutes from '../modules/reports/routes.ts';
import authRoutes from '../modules/auth/routes.ts';
import usersRoutes from '../modules/users/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';
import supplierRoutes from '../modules/suppliers/supplier.routes.ts';

const router = Router();

router.use('/stock-monitoring', stockMonitoringRoutes);
router.use('/reports', reportsRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/stock-receiving', stockReceivingRoutes);
router.use('/suppliers', supplierRoutes);

export default router;