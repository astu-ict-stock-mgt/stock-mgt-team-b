import type { NextFunction, Request, Response } from 'express';
import {
  createReportRecord,
  generateReportCsv,
  getCategoryMovementAggregation,
  getCategoryValuationAggregation,
  getCostLayersAnalysis,
  getFinancialLedger,
  getFinancialSummary,
  getFiscalValuationStatement,
  getInventoryValuationReport,
  getIssuingReport,
  getMonthlyTrendsAggregation,
  getReceivingReport,
  getReportRecordById,
  getReportRecords,
  getReportsOverviewSummary,
  getStockMovementReport,
  getStockStatusReport,
  getSupplierReport,
  getTopIssuedItemsAggregation,
  getWarehouseMovementAggregation,
} from './service.ts';
import type { ReportFilters } from './types.ts';

const extractFilters = (req: Request): ReportFilters => {
  const {
    dateFrom,
    dateTo,
    warehouseId,
    supplierId,
    inventoryItemId,
    type,
    categoryId,
    state,
    search,
  } = req.query;

  return {
    dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
    dateTo: typeof dateTo === 'string' ? dateTo : undefined,
    warehouseId: typeof warehouseId === 'string' ? warehouseId : undefined,
    supplierId: typeof supplierId === 'string' ? supplierId : undefined,
    inventoryItemId: typeof inventoryItemId === 'string' ? inventoryItemId : undefined,
    type: typeof type === 'string' ? type : undefined,
    categoryId: typeof categoryId === 'string' ? categoryId : undefined,
    state: typeof state === 'string' ? state : undefined,
    search: typeof search === 'string' ? search : undefined,
  };
};

export const getReportsSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const summary = await getReportsOverviewSummary(filters);
    res.status(200).json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
};

export const getStockMovementReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getStockMovementReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getReceivingReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getReceivingReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getIssuingReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getIssuingReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getInventoryValuationReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getInventoryValuationReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getSupplierReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getSupplierReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getStockStatusReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const result = await getStockStatusReport(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const exportReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.query.type as string;
    const format = (req.query.format as string) || 'csv';
    const filters = extractFilters(req);

    if (format === 'json') {
      let data: unknown;
      if (type === 'stock-movement') data = await getStockMovementReport(filters);
      else if (type === 'receiving') data = await getReceivingReport(filters);
      else if (type === 'issuing') data = await getIssuingReport(filters);
      else if (type === 'valuation') data = await getInventoryValuationReport(filters);
      else if (type === 'suppliers') data = await getSupplierReport(filters);
      else if (type === 'stock-status') data = await getStockStatusReport(filters);
      else data = await getReportsOverviewSummary(filters);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.json"`);
      res.status(200).json(data);
      return;
    }

    const { filename, content } = await generateReportCsv(type, filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (error) {
    next(error);
  }
};

export const createReportRecordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id ?? '';
    const report = await createReportRecord(req.body, userId);
    res.status(201).json({ status: 'success', data: report });
  } catch (error) {
    next(error);
  }
};

export const getReportRecordsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reports = await getReportRecords();
    res.status(200).json({ status: 'success', data: reports });
  } catch (error) {
    next(error);
  }
};

export const getReportRecordByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const report = await getReportRecordById(id as string);
    res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    next(error);
  }
};

// Data Aggregation & Analytics Endpoints Handlers
export const getCategoryMovementAggregationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getCategoryMovementAggregation(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseMovementAggregationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getWarehouseMovementAggregation(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrendsAggregationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getMonthlyTrendsAggregation(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getTopIssuedItemsAggregationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const filters = extractFilters(req);
    const data = await getTopIssuedItemsAggregation(limit, filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getCategoryValuationAggregationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getCategoryValuationAggregation(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getCostLayersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getCostLayersAnalysis(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getFinancialLedgerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getFinancialLedger(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getFiscalStatementHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getFiscalValuationStatement(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = extractFilters(req);
    const data = await getFinancialSummary(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// Aliases for backward compatibility
export const stockMovementReport = getStockMovementReportHandler;
export const receivingReport = getReceivingReportHandler;
export const issuingReport = getIssuingReportHandler;
export const getStockTransactionSummary = getReportsSummaryHandler;



