import { Router } from 'express';
import reportsRoutes from '../modules/reports/routes.ts';

const router = Router();

// Mount reports module router under /reports (SRS Section 3.1 & 4.4.8)
router.use('/reports', reportsRoutes);

export default router;
