import { Router } from 'express';
import reportsRoutes from '../modules/reports/routes.ts';
import authRoutes from '../modules/auth/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';
import inventoryRoutes from '../modules/inventory/routes.ts';
import usersRoutes from '../modules/users/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stock-receiving', stockReceivingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);
router.use('/users', usersRoutes);

export default router;
