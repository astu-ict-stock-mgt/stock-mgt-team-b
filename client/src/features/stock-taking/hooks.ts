import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockTakingApi } from './api';
import type {
  ApproveReconciliationPayload,
  RejectReconciliationPayload,
  SubmitCountPayload,
} from './types';

export const stockTakingKeys = {
  all: ['stock-taking'] as const,
  warehouses: () => [...stockTakingKeys.all, 'warehouses'] as const,
  sessions: (filters?: { warehouseId?: string; status?: string }) =>
    [...stockTakingKeys.all, 'sessions', filters] as const,
  worksheet: (sessionId: string) => [...stockTakingKeys.all, 'worksheet', sessionId] as const,
  reconciliations: (status?: string) =>
    [...stockTakingKeys.all, 'reconciliations', status] as const,
};

// Fetch warehouses
export function useWarehouses() {
  return useQuery({
    queryKey: stockTakingKeys.warehouses(),
    queryFn: () => stockTakingApi.getWarehouses(),
    staleTime: 60000,
  });
}

// Fetch stock take sessions
export function useStockTakeSessions(filters?: { warehouseId?: string; status?: string }) {
  return useQuery({
    queryKey: stockTakingKeys.sessions(filters),
    queryFn: () => stockTakingApi.listSessions(filters),
    staleTime: 10000,
  });
}

// Fetch worksheet items for a specific stock take session
export function useSessionWorksheet(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: stockTakingKeys.worksheet(sessionId || ''),
    queryFn: () => stockTakingApi.getSessionWorksheet(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 5000,
  });
}

// Start a new session
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (warehouseId: string) => stockTakingApi.createSession(warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTakingKeys.all });
    },
  });
}

// Submit physical count
export function useSubmitCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitCountPayload) => stockTakingApi.submitCount(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.worksheet(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.reconciliations(),
      });
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.sessions(),
      });
    },
  });
}

// Complete session
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => stockTakingApi.completeSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.worksheet(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.sessions(),
      });
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.reconciliations(),
      });
    },
  });
}

// Fetch reconciliations (for PAO & Administrator)
export function useReconciliations(status?: string) {
  return useQuery({
    queryKey: stockTakingKeys.reconciliations(status),
    queryFn: () => stockTakingApi.getReconciliations(status),
    staleTime: 5000,
  });
}

// Approve reconciliation adjustment
export function useApproveReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveReconciliationPayload) =>
      stockTakingApi.approveReconciliation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.reconciliations(),
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory'],
      });
    },
  });
}

// Reject reconciliation
export function useRejectReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RejectReconciliationPayload) =>
      stockTakingApi.rejectReconciliation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockTakingKeys.reconciliations(),
      });
    },
  });
}
