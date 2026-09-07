/**
 * Stock Receiving hooks
 * Thin data-fetching hooks built on @tanstack/react-query
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGrn,
  fetchGrn,
  fetchGrns,
  fetchSuppliers,
  fetchWarehouses,
  searchItems,
  createQuickSupplier,
  createQuickWarehouse,
  sendGrnToInspection,
  submitGrnInspection,
  confirmGrnRouting,
  approveGrn,
  rejectGrn,
  CreateGrnPayload,
  GrnWorkflowStatus,
  InspectionItemResult,
} from './api';

const QUERY_KEYS = {
  suppliers: ['stock-receiving', 'suppliers'] as const,
  warehouses: ['stock-receiving', 'warehouses'] as const,
  items: (query: string) => ['stock-receiving', 'items', query] as const,
  grns: (status?: GrnWorkflowStatus) => ['stock-receiving', 'grns', status ?? 'all'] as const,
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

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuickSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuickWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    },
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

export function useGrnList(status?: GrnWorkflowStatus) {
  return useQuery({
    queryKey: QUERY_KEYS.grns(status),
    queryFn: () => fetchGrns(status),
    refetchInterval: 10_000, // auto-refresh every 10s so queue updates
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
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}

export function useSendToInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendGrnToInspection(id),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}

export function useSubmitInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      items,
      inspectorNotes,
    }: {
      id: string;
      items: InspectionItemResult[];
      inspectorNotes?: string;
    }) => submitGrnInspection(id, items, inspectorNotes),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}

export function useConfirmRouting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmGrnRouting(id),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}

export function useApproveGrn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveGrn(id),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}

export function useRejectGrn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectGrn(id, reason),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ['stock-receiving', 'grns'] });
      queryClient.setQueryData(QUERY_KEYS.grn(grn.id), grn);
    },
  });
}
