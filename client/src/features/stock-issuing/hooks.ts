import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  stockIssuingApi,
  CreateRequisitionPayload,
  Requisition,
  InventoryItem,
  IssueHistoryItem,
} from './api';

// Cache keys
export const stockIssuingKeys = {
  all: ['stock-issuing'] as const,
  inventory: () => [...stockIssuingKeys.all, 'inventory'] as const,
  requisitions: () => [...stockIssuingKeys.all, 'requisitions'] as const,
  history: () => [...stockIssuingKeys.all, 'history'] as const,
};

// ============================================================
// QUERY HOOKS
// ============================================================

export const useInventoryItems = () => {
  return useQuery<InventoryItem[]>({
    queryKey: stockIssuingKeys.inventory(),
    queryFn: () => stockIssuingApi.getInventoryItems(),
    staleTime: 10000,
  });
};

export const useRequisitions = (statusFilter?: string) => {
  return useQuery<Requisition[]>({
    queryKey: [...stockIssuingKeys.requisitions(), statusFilter ?? 'ALL'],
    queryFn: () => stockIssuingApi.getRequisitions(statusFilter),
    staleTime: 5000,
  });
};

export const useIssueHistory = () => {
  return useQuery<IssueHistoryItem[]>({
    queryKey: stockIssuingKeys.history(),
    queryFn: () => stockIssuingApi.getIssueHistory(),
    staleTime: 10000,
  });
};

// ============================================================
// MUTATION HOOKS
// ============================================================

export const useCreateRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRequisitionPayload) => stockIssuingApi.createRequisition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIssuingKeys.requisitions() });
    },
  });
};

export const useApproveRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      stockIssuingApi.approveRequisition(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIssuingKeys.requisitions() });
    },
  });
};

export const useRejectRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectedBy, reason }: { id: string; rejectedBy: string; reason: string }) =>
      stockIssuingApi.rejectRequisition(id, { rejectedBy, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIssuingKeys.requisitions() });
    },
  });
};

export const useIssueRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, issuedBy }: { id: string; issuedBy: string }) =>
      stockIssuingApi.issueRequisition(id, issuedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIssuingKeys.requisitions() });
      queryClient.invalidateQueries({ queryKey: stockIssuingKeys.inventory() });
      // Invalidate inventory module caches as well to keep them in sync
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
