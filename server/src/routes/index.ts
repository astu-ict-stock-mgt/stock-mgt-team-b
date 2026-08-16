import { Router } from 'express';
import stockMonitoringRoutes from '../modules/stock-monitoring/stock-monitoring.routes';

const router = Router();

// Import Individual module routes here
router.use('/stock-monitoring', stockMonitoringRoutes);

export default router;
