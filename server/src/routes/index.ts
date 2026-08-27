import { Router } from 'express';
import inventoryRoutes from '../modules/inventory/routes.ts';
import reportsRoutes from '../modules/reports/routes.ts';
import stockIssuingRoutes from '../modules/stock-issuing/routes.ts';
import stockTakingRoutes from '../modules/stock-taking/routes.ts';
import authRoutes from '../modules/auth/routes.ts';
import inventoryRoutes from '../modules/inventory/routes.ts';
import usersRoutes from '../modules/users/routes.ts';
import auditLogRoutes from '../modules/audit-log/routes.ts';

const router = Router();

// Mount reports module router under /reports (SRS Section 3.1 & 4.4.8)
router.use('/reports', reportsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stock-issuing', stockIssuingRoutes);
router.use('/stock-taking', stockTakingRoutes);
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/users', usersRoutes);
router.use('/audit-log', auditLogRoutes);

export default router;
