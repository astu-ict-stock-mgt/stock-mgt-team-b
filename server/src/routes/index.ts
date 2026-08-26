import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import reportsRoutes from '../modules/reports/routes.ts';
import suppliersRoutes from '../modules/suppliers/routes.ts';
import usersRoutes from '../modules/users/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/reports', reportsRoutes);
router.use('/suppliers', suppliersRoutes);

export default router;
