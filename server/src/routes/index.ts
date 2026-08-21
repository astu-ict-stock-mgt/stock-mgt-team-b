import { Router } from 'express';

import reportsRoutes from '../modules/reports/routes.ts';

import authRoutes from '../modules/auth/routes.ts';

import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';

const router = Router();

// Mount reports module router under /reports (SRS Section 3.1 & 4.4.8)

router.use('/reports', reportsRoutes);

router.use('/auth', authRoutes);

router.use('/stock-receiving', stockReceivingRoutes);

export default router;