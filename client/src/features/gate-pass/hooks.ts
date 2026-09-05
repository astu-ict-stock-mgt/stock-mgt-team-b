import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingOutbound,
  fetchPendingInbound,
  clearOutboundDispatch,
  clearInboundDelivery,
  flagGateDiscrepancy,
  fetchGatePassHistory,
  verifyGateReference,
} from './api';
import type { ClearOutboundPayload, ClearInboundPayload, FlagDiscrepancyPayload } from './types';

export const usePendingOutbound = () => {
  return useQuery({
    queryKey: ['gate-pass', 'pending-outbound'],
    queryFn: fetchPendingOutbound,
    refetchInterval: 15000,
  });
};

export const usePendingInbound = () => {
  return useQuery({
    queryKey: ['gate-pass', 'pending-inbound'],
    queryFn: fetchPendingInbound,
    refetchInterval: 15000,
  });
};

export const useGatePassHistory = (params?: {
  direction?: 'OUTBOUND' | 'INBOUND';
  status?: 'CLEARED' | 'FLAGGED';
  query?: string;
}) => {
  return useQuery({
    queryKey: ['gate-pass', 'history', params],
    queryFn: () => fetchGatePassHistory(params),
  });
};

export const useVerifyReference = (reference: string, enabled = false) => {
  return useQuery({
    queryKey: ['gate-pass', 'verify', reference],
    queryFn: () => verifyGateReference(reference),
    enabled: enabled && reference.trim().length > 0,
  });
};

export const useClearOutbound = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClearOutboundPayload) => clearOutboundDispatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'pending-outbound'] });
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'history'] });
    },
  });
};

export const useClearInbound = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClearInboundPayload) => clearInboundDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'pending-inbound'] });
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'history'] });
    },
  });
};

export const useFlagDiscrepancy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlagDiscrepancyPayload) => flagGateDiscrepancy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'pending-outbound'] });
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'pending-inbound'] });
      queryClient.invalidateQueries({ queryKey: ['gate-pass', 'history'] });
    },
  });
};
