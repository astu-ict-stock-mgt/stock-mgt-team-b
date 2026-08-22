import { useState, useEffect, useCallback } from 'react';
import {
  fetchReportsSummary,
  fetchStockMovementReport,
  fetchReceivingReport,
  fetchIssuingReport,
  fetchValuationReport,
  fetchSupplierReport,
  fetchStockStatusReport,
  fetchReportHistory,
  createReport,
  downloadReportCsv,
} from './api';
import type {
  IssuingReportData,
  ReceivingReportData,
  ReportFiltersState,
  ReportsSummaryData,
  SavedReportItem,
  StockMovementReportData,
  StockStatusReportData,
  SupplierReportData,
  ValuationReportData,
} from './types';

const defaultFilters: ReportFiltersState = {
  dateFrom: '',
  dateTo: '',
  warehouseId: '',
  supplierId: '',
  inventoryItemId: '',
  type: '',
  search: '',
};

export function useReportsData() {
  const [filters, setFilters] = useState<ReportFiltersState>(defaultFilters);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<ReportsSummaryData | null>(null);
  const [stockMovement, setStockMovement] = useState<StockMovementReportData | null>(null);
  const [receiving, setReceiving] = useState<ReceivingReportData | null>(null);
  const [issuing, setIssuing] = useState<IssuingReportData | null>(null);
  const [valuation, setValuation] = useState<ValuationReportData | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierReportData | null>(null);
  const [stockStatus, setStockStatus] = useState<StockStatusReportData | null>(null);
  const [history, setHistory] = useState<SavedReportItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        movementRes,
        receivingRes,
        issuingRes,
        valuationRes,
        supplierRes,
        statusRes,
        historyRes,
      ] = await Promise.all([
        fetchReportsSummary(filters),
        fetchStockMovementReport(filters),
        fetchReceivingReport(filters),
        fetchIssuingReport(filters),
        fetchValuationReport(filters),
        fetchSupplierReport(filters),
        fetchStockStatusReport(filters),
        fetchReportHistory(),
      ]);

      setSummary(summaryRes);
      setStockMovement(movementRes);
      setReceiving(receivingRes);
      setIssuing(issuingRes);
      setValuation(valuationRes);
      setSuppliers(supplierRes);
      setStockStatus(statusRes);
      setHistory(historyRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilter = (key: keyof ReportFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const exportCsv = async (reportType: string) => {
    await downloadReportCsv(reportType, filters);
  };

  const saveReport = async (name: string, type: string) => {
    const newReport = await createReport({ name, type, parameters: filters as any });
    setHistory((prev) => [newReport, ...prev]);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    loading,
    error,
    refresh: loadData,
    summary,
    stockMovement,
    receiving,
    issuing,
    valuation,
    suppliers,
    stockStatus,
    history,
    exportCsv,
    saveReport,
  };
}
