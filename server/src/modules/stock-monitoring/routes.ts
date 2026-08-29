import { Router } from 'express';
import { requireAuth } from '../../middlewares/rbac.ts';
import { getStockMonitoring, getItemMonitoring } from './controller.ts';
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
