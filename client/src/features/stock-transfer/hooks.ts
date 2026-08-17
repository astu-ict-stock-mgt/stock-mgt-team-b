// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockTransferApi } from './api';

export const STOCK_TRANSFER_KEYS = {
  all: ['stock-transfer'],
  items: () => [...STOCK_TRANSFER_KEYS.all, 'items'],
  locations: () => [...STOCK_TRANSFER_KEYS.all, 'locations'],
  itemLocations: (itemId) => [...STOCK_TRANSFER_KEYS.all, 'item-locations', itemId],
  history: (search) => [...STOCK_TRANSFER_KEYS.all, 'history', search ?? ''],
};

export function useItems() {
  return useQuery({
    queryKey: STOCK_TRANSFER_KEYS.items(),
    queryFn: () => stockTransferApi.getItems(),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: STOCK_TRANSFER_KEYS.locations(),
    queryFn: () => stockTransferApi.getLocations(),
  });
}

export function useItemStockLocations(itemId) {
  return useQuery({
    queryKey: STOCK_TRANSFER_KEYS.itemLocations(itemId),
    queryFn: () => (itemId ? stockTransferApi.getItemStockLocations(itemId) : Promise.resolve([])),
    enabled: Boolean(itemId),
  });
}

// AC1: Source location dropdown only shows locations currently holding stock (> 0).
export function useAvailableSourceLocations(itemId) {
  const query = useItemStockLocations(itemId);
  const availableLocations = (query.data || []).filter((loc) => loc.availableQuantity > 0);
  return {
    ...query,
    availableLocations,
    allLocations: query.data || [],
  };
}

export function useTransferHistory(searchQuery) {
  return useQuery({
    queryKey: STOCK_TRANSFER_KEYS.history(searchQuery),
    queryFn: () => stockTransferApi.getTransferHistory(searchQuery),
  });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stockTransferApi.createTransfer(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEYS.itemLocations(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEYS.items() });
    },
  });
}
