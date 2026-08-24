import supplierRoutes from '../modules/suppliers/supplier.routes.ts';
import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import stockReceivingRoutes from '../modules/stock-receiving/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stock-receiving', stockReceivingRoutes);
router.use('/suppliers', supplierRoutes);

export default router;
