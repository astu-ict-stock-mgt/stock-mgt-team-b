import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stock-receiving', stockReceivingRoutes);

export default router;
