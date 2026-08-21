import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createReportRecordHandler,
  exportReportHandler,
  getInventoryValuationReportHandler,
  getIssuingReportHandler,
  getReceivingReportHandler,
  getReportRecordByIdHandler,
  getReportRecordsHandler,
  getReportsSummaryHandler,
  getStockMovementReportHandler,
  getStockStatusReportHandler,
  getSupplierReportHandler,
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

// Report export (CSV / JSON)
router.get('/export', validateExportQuery, exportReportHandler);

// Saved reports history
router.post('/', validateCreateReport, createReportRecordHandler);
router.get('/history', getReportRecordsHandler);
router.get('/history/:id', validateReportId, getReportRecordByIdHandler);

export default router;
