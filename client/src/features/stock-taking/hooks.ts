import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createStockTake,
  fetchStockTake,
  submitCount,
  completeStockTake,
  fetchReconciliations,
  approveReconciliation,
  rejectReconciliation,
  fetchInventoryItemsForWarehouse,
} from './api';
import type { StockTakeSession, Reconciliation, InventoryItem } from './types';

// ===== Session =====

export function useCreateStockTake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => createStockTake(warehouseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockTake', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockTakeSessions'] });
    },
  });
}

export function useStockTake(sessionId: string) {
  return useQuery({
    queryKey: ['stockTake', sessionId],
    queryFn: () => fetchStockTake(sessionId),
    enabled: !!sessionId,
  });
}

export function useSubmitCount(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryItemId, physicalQuantity }: { inventoryItemId: string; physicalQuantity: number }) =>
      submitCount(sessionId, inventoryItemId, physicalQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockTake', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliations', sessionId] });
    },
  });
}

export function useCompleteStockTake(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeStockTake(sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockTake', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliations', sessionId] });
    },
  });
}

// ===== Reconciliations =====

export function useReconciliations(sessionId: string) {
  return useQuery({
    queryKey: ['reconciliations', sessionId],
    queryFn: () => fetchReconciliations(sessionId),
    enabled: !!sessionId,
  });
}

export function useApproveReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reconciliationId, reason, unitCost }: { reconciliationId: string; reason: string; unitCost?: number }) =>
      approveReconciliation(reconciliationId, reason, unitCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['stockTake'] });
    },
  });
}

export function useRejectReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reconciliationId, reason }: { reconciliationId: string; reason: string }) =>
      rejectReconciliation(reconciliationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['stockTake'] });
    },
  });
}

// ===== Inventory Items =====

export function useInventoryItemsForWarehouse(warehouseId?: string) {
  return useQuery({
    queryKey: ['inventoryItemsForWarehouse', warehouseId],
    queryFn: () => fetchInventoryItemsForWarehouse(warehouseId || ''),
    enabled: true,
  });
}