// client/src/features/stock-issuing/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockIssuingApi } from './api';

// Cache keys
export const stockIssuingKeys = {
  all: ['stock-issuing'] as const,
  inventory: () => [...stockIssuingKeys.all, 'inventory'] as const,
  requisitions: () => [...stockIssuingKeys.all, 'requisitions'] as const,
};

// ============================================================
// QUERY HOOKS
// ============================================================

export const useInventoryItems = () => {
  return useQuery({
    queryKey: stockIssuingKeys.inventory(),
    queryFn: () => stockIssuingApi.getInventoryItems(),
    staleTime: 10000,
  });
};

export const useRequisitions = () => {
  return useQuery({
    queryKey: stockIssuingKeys.requisitions(),
    queryFn: () => stockIssuingApi.getRequisitions(),
    staleTime: 5000,
  });
};

// ============================================================
// MUTATION HOOKS
// ============================================================

export const useCreateRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      requesterId: string;
      requesterName: string;
      department: string;
      items: { itemId: string; quantityRequested: number }[];
      justification: string;
    }) => stockIssuingApi.createRequisition(data),
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
