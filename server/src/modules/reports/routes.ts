import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createReportRecordHandler,
  exportReportHandler,
  getCategoryMovementAggregationHandler,
  getCategoryValuationAggregationHandler,
  getInventoryValuationReportHandler,
  getIssuingReportHandler,
  getMonthlyTrendsAggregationHandler,
  getReceivingReportHandler,
  getReportRecordByIdHandler,
  getReportRecordsHandler,
  getReportsSummaryHandler,
  getStockMovementReportHandler,
  getStockStatusReportHandler,
  getSupplierReportHandler,
  getTopIssuedItemsAggregationHandler,
  getWarehouseMovementAggregationHandler,
} from './controller.ts';
import {
  validateCreateReport,
  validateExportQuery,
  validateReportFilters,
  validateReportId,
} from './validation.ts';

const router = Router();

// Apply RBAC: Report generation & viewing is accessible to authorized management & operational roles
// (SRS Section 4.4.8 & Section 2.3)
router.use(
  requireAuth,
  requireRole(
    'ADMINISTRATOR',
    'PAO',
    'STOREKEEPER',
    'STOCK_CLERK',
    'ACCOUNTANT',
    'DEPARTMENT_HEAD'
  )
);

// Reports summary overview for dashboard
router.get('/summary', validateReportFilters, getReportsSummaryHandler);

// Operational and analytical reports
router.get('/stock-movement', validateReportFilters, getStockMovementReportHandler);
router.get('/receiving', validateReportFilters, getReceivingReportHandler);
router.get('/issuing', validateReportFilters, getIssuingReportHandler);
router.get('/valuation', validateReportFilters, getInventoryValuationReportHandler);
router.get('/suppliers', validateReportFilters, getSupplierReportHandler);
router.get('/stock-status', validateReportFilters, getStockStatusReportHandler);

// Data Aggregation & Analytical APIs (Issue: Build data aggregation apis for reports)
router.get('/analytics/category-movements', validateReportFilters, getCategoryMovementAggregationHandler);
router.get('/analytics/warehouse-movements', validateReportFilters, getWarehouseMovementAggregationHandler);
router.get('/analytics/monthly-trends', validateReportFilters, getMonthlyTrendsAggregationHandler);
router.get('/analytics/top-issued-items', validateReportFilters, getTopIssuedItemsAggregationHandler);
router.get('/analytics/category-valuation', validateReportFilters, getCategoryValuationAggregationHandler);

// Report export (CSV / JSON)
router.get('/export', validateExportQuery, exportReportHandler);

// Saved reports history
router.post('/', validateCreateReport, createReportRecordHandler);
router.get('/history', getReportRecordsHandler);
router.get('/history/:id', validateReportId, getReportRecordByIdHandler);

export default router;
