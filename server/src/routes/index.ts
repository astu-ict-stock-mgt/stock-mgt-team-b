import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import inventoryRoutes from '../modules/inventory/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);

export default router;
