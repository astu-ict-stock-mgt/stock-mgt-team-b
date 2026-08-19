import { Router } from 'express';
import authRoutes from '../modules/auth/routes.ts';
import usersRoutes from '../modules/users/routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;
