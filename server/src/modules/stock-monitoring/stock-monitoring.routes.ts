import { Router } from 'express';
import { getReorderAlerts } from './stock-monitoring.controller';

const router = Router();

// Sub-route path
router.get('/reorder-alerts', getReorderAlerts);

export default router;