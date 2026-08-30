/**
 * Stock Receiving hooks
 * Thin data-fetching hooks built on @tanstack/react-query, configured via
 * QueryClientProvider in src/main.tsx.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGrn,
  fetchGrn,
  fetchGrns,
  fetchSuppliers,
  fetchWarehouses,
  searchItems,
  CreateGrnPayload,
} from './api';

const QUERY_KEYS = {
  suppliers: ['stock-receiving', 'suppliers'] as const,
  warehouses: ['stock-receiving', 'warehouses'] as const,
  items: (query: string) => ['stock-receiving', 'items', query] as const,
  grns: ['stock-receiving', 'grns'] as const,
  grn: (id: string) => ['stock-receiving', 'grns', id] as const,
};

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: fetchSuppliers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: QUERY_KEYS.warehouses,
    queryFn: fetchWarehouses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useItemSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.items(query),
    queryFn: () => searchItems(query),
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}

export function useGrnList() {
  return useQuery({
    queryKey: QUERY_KEYS.grns,
    queryFn: fetchGrns,
  });
}

export function useGrn(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.grn(id ?? ''),
    queryFn: () => fetchGrn(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateGrn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGrnPayload) => createGrn(payload),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grns });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}
