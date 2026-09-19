import { useQuery } from '@tanstack/react-query';
import {
  fetchCostLayers,
  fetchFinancialLedger,
  fetchFinancialSummary,
  fetchFiscalStatement,
} from './api';
import type { ValuationFilterState } from './types';

export const useFinancialSummary = (filters: Partial<ValuationFilterState> = {}) => {
  return useQuery({
    queryKey: ['valuation', 'summary', filters],
    queryFn: () => fetchFinancialSummary(filters),
    staleTime: 30000,
  });
};

export const useCostLayers = (filters: Partial<ValuationFilterState> = {}) => {
  return useQuery({
    queryKey: ['valuation', 'cost-layers', filters],
    queryFn: () => fetchCostLayers(filters),
    staleTime: 30000,
  });
};

export const useFinancialLedger = (filters: Partial<ValuationFilterState> = {}) => {
  return useQuery({
    queryKey: ['valuation', 'ledger', filters],
    queryFn: () => fetchFinancialLedger(filters),
    staleTime: 30000,
  });
};

export const useFiscalStatement = (filters: Partial<ValuationFilterState> = {}) => {
  return useQuery({
    queryKey: ['valuation', 'statement', filters],
    queryFn: () => fetchFiscalStatement(filters),
    staleTime: 30000,
  });
};
