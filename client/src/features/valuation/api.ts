import { apiClient } from '../../api/apiClient';
import type {
  AccountantFinancialSummary,
  CostLayersResponse,
  FinancialLedgerResponse,
  FiscalStatementData,
  ValuationFilterState,
} from './types';

const cleanParams = (filters: Partial<ValuationFilterState>) => {
  const p: Record<string, string> = {};
  if (filters.warehouseId) p.warehouseId = filters.warehouseId;
  if (filters.categoryId) p.categoryId = filters.categoryId;
  if (filters.dateFrom) p.dateFrom = filters.dateFrom;
  if (filters.dateTo) p.dateTo = filters.dateTo;
  if (filters.search) p.search = filters.search;
  if (filters.state && filters.state !== 'all') p.state = filters.state;
  return p;
};

export const fetchFinancialSummary = async (
  filters: Partial<ValuationFilterState> = {}
): Promise<AccountantFinancialSummary> => {
  const res = await apiClient.get<{ status: string; data: AccountantFinancialSummary }>(
    '/reports/valuation/summary',
    { params: cleanParams(filters) }
  );
  return res.data.data;
};

export const fetchCostLayers = async (
  filters: Partial<ValuationFilterState> = {}
): Promise<CostLayersResponse> => {
  const res = await apiClient.get<{ status: string; data: CostLayersResponse }>(
    '/reports/valuation/cost-layers',
    { params: cleanParams(filters) }
  );
  return res.data.data;
};

export const fetchFinancialLedger = async (
  filters: Partial<ValuationFilterState> = {}
): Promise<FinancialLedgerResponse> => {
  const res = await apiClient.get<{ status: string; data: FinancialLedgerResponse }>(
    '/reports/valuation/ledger',
    { params: cleanParams(filters) }
  );
  return res.data.data;
};

export const fetchFiscalStatement = async (
  filters: Partial<ValuationFilterState> = {}
): Promise<FiscalStatementData> => {
  const res = await apiClient.get<{ status: string; data: FiscalStatementData }>(
    '/reports/valuation/statement',
    { params: cleanParams(filters) }
  );
  return res.data.data;
};

export const exportValuationCsv = async (
  type: 'cost-layers' | 'financial-ledger' | 'valuation',
  filters: Partial<ValuationFilterState> = {}
): Promise<void> => {
  const response = await apiClient.get('/reports/export', {
    params: {
      type,
      format: 'csv',
      ...cleanParams(filters),
    },
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
