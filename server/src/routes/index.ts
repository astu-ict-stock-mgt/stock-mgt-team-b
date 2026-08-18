import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import stockIssuingRoutes from '../modules/stock-issuing/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stock-issuing', stockIssuingRoutes);

export default router;

