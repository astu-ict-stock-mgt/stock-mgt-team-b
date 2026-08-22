import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStockTakeItems, submitStockTake, processStockTake } from './api';
import type { CreateStockTakeDto } from './types';

export function useStockTakeItems(
  statusFilter?: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: ['stockTake', statusFilter || 'all', page, pageSize],
    queryFn: () => fetchStockTakeItems(statusFilter, page, pageSize),
  });
}

export function useSubmitStockTake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockTakeDto) => submitStockTake(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTake'] });
    },
  });
}

export function useProcessStockTake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: 'approve' | 'reject';
      notes?: string;
    }) => processStockTake(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTake'] });
    },
  });
}
