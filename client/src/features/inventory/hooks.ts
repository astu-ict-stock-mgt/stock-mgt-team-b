// client/src/features/inventory/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, inventoryKeys, InventoryFilters, InventoryItem } from './api';

// ============================================================
// QUERY HOOKS
// ============================================================

export const useInventoryItems = (filters?: InventoryFilters) => {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => inventoryApi.getAll(filters),
    staleTime: 30000,
  });
};

export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryApi.getById(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

export const useInventoryLots = (itemId: string) => {
  return useQuery({
    queryKey: inventoryKeys.lots(itemId),
    queryFn: () => inventoryApi.getLotsByItemId(itemId),
    enabled: !!itemId,
    staleTime: 30000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: () => inventoryApi.getCategories(),
    staleTime: 60000,
  });
};

// ============================================================
// MUTATION HOOKS
// ============================================================

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      inventoryApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};
