import apiClient from '../../api/apiClient';
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

const API_BASE = '/reports';

const cleanParams = (params: Partial<ReportFiltersState>) => {
  const p: Record<string, string> = {};
  if (params.dateFrom) p.dateFrom = params.dateFrom;
  if (params.dateTo) p.dateTo = params.dateTo;
  if (params.warehouseId) p.warehouseId = params.warehouseId;
  if (params.supplierId) p.supplierId = params.supplierId;
  if (params.inventoryItemId) p.inventoryItemId = params.inventoryItemId;
  if (params.type) p.type = params.type;
  return p;
};

export async function fetchReportsSummary(
  filters: Partial<ReportFiltersState> = {}
): Promise<ReportsSummaryData> {
  const res = await apiClient.get<{ status: string; data: ReportsSummaryData }>(
    `${API_BASE}/summary`,
    { params: cleanParams(filters) }
  );
  return res.data.data;
}

export async function fetchStockMovementReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<StockMovementReportData> {
  const res = await apiClient.get<{
    status: string;
    data: StockMovementReportData;
  }>(`${API_BASE}/stock-movement`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchReceivingReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<ReceivingReportData> {
  const res = await apiClient.get<{
    status: string;
    data: ReceivingReportData;
  }>(`${API_BASE}/receiving`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchIssuingReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<IssuingReportData> {
  const res = await apiClient.get<{
    status: string;
    data: IssuingReportData;
  }>(`${API_BASE}/issuing`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchValuationReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<ValuationReportData> {
  const res = await apiClient.get<{
    status: string;
    data: ValuationReportData;
  }>(`${API_BASE}/valuation`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchSupplierReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<SupplierReportData> {
  const res = await apiClient.get<{
    status: string;
    data: SupplierReportData;
  }>(`${API_BASE}/suppliers`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchStockStatusReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<StockStatusReportData> {
  const res = await apiClient.get<{
    status: string;
    data: StockStatusReportData;
  }>(`${API_BASE}/stock-status`, {
    params: cleanParams(filters),
  });

  return res.data.data;
}

export async function fetchReportHistory(): Promise<SavedReportItem[]> {
  const res = await apiClient.get<{ status: string; data: SavedReportItem[] }>(
    `${API_BASE}/history`
  );
  return res.data.data;
}

export async function createReport(data: {
  name: string;
  type: string;
  parameters?: Record<string, unknown>;
}): Promise<SavedReportItem> {
  const res = await apiClient.post<{ status: string; data: SavedReportItem }>(API_BASE, data);
  return res.data.data;
}

export async function downloadReportCsv(
  reportType: string,
  filters: Partial<ReportFiltersState> = {}
): Promise<void> {
  const response = await apiClient.get(`${API_BASE}/export`, {
    params: {
      ...cleanParams(filters),
      type: reportType,
      format: 'csv',
    },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute(
    'download',
    `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
