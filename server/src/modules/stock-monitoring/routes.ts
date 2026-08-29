import { Router } from 'express';
import { requireAuth } from '../../middlewares/rbac.ts';
import {
  getStockMonitoring,
  getItemMonitoring,
  getStockAlertsController,
  getSummaryStatsController,
} from './controller.ts';
import { validateGetStockLevels, validateGetItemStockLevel } from './validation.ts';

const router = Router();

/**
 * GET /api/stock-monitoring
 * Returns all items with their stock levels categorized by severity
 */
router.get(
  '/',
  requireAuth,
  validateGetStockLevels,
  getStockMonitoring
);

/**
 * GET /api/stock-monitoring/alerts
 * Returns alert items with filter support
 */
router.get(
  '/alerts',
  requireAuth,
  getStockAlertsController
);

/**
 * GET /api/stock-monitoring/summary-stats
 * Returns aggregated summary statistics
 */
router.get(
  '/summary-stats',
  requireAuth,
  getSummaryStatsController
);

/**
 * GET /api/stock-monitoring/:itemId
 * Returns stock level for a specific item
 */
router.get(
  '/:itemId',
  requireAuth,
  validateGetItemStockLevel,
  getItemMonitoring
);

export default router;

