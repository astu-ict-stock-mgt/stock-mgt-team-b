import { Router } from 'express';
import reportsRoutes from '../modules/reports/routes.ts';

const router = Router();

// Mount reports module router under /reports (SRS Section 3.1 & 4.4.8)
router.use('/reports', reportsRoutes);
import authRoutes from '../modules/auth/routes.ts';
import usersRoutes from '../modules/users/routes.ts';

// const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;
