import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  stockTransferApi,
  Item,
  Location,
  ItemStockLocation,
  TransferRecord,
  CreateTransferPayload,
} from './api';

export const STOCK_TRANSFER_KEYS = {
  all: ['stock-transfer'] as const,
  items: () => [...STOCK_TRANSFER_KEYS.all, 'items'] as const,
  locations: () => [...STOCK_TRANSFER_KEYS.all, 'locations'] as const,
  itemLocations: (itemId?: string) =>
    [...STOCK_TRANSFER_KEYS.all, 'item-locations', itemId ?? ''] as const,
  history: (search?: string) => [...STOCK_TRANSFER_KEYS.all, 'history', search ?? ''] as const,
};

export function useItems() {
  return useQuery<Item[]>({
    queryKey: STOCK_TRANSFER_KEYS.items(),
    queryFn: () => stockTransferApi.getItems(),
  });
}

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: STOCK_TRANSFER_KEYS.locations(),
    queryFn: () => stockTransferApi.getLocations(),
  });
}

export function useItemStockLocations(itemId?: string) {
  return useQuery<ItemStockLocation[]>({
    queryKey: STOCK_TRANSFER_KEYS.itemLocations(itemId),
    queryFn: () => (itemId ? stockTransferApi.getItemStockLocations(itemId) : Promise.resolve([])),
    enabled: Boolean(itemId),
  });
}

// AC1: Source location dropdown only shows locations currently holding stock (> 0).
export function useAvailableSourceLocations(itemId?: string) {
  const query = useItemStockLocations(itemId);
  const availableLocations = (query.data || []).filter((loc) => loc.availableQuantity > 0);
  return {
    ...query,
    availableLocations,
    allLocations: query.data || [],
  };
}

export function useTransferHistory(searchQuery?: string) {
  return useQuery<TransferRecord[]>({
    queryKey: STOCK_TRANSFER_KEYS.history(searchQuery),
    queryFn: () => stockTransferApi.getTransferHistory(searchQuery),
  });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation<TransferRecord, Error, CreateTransferPayload>({
    mutationFn: (payload: CreateTransferPayload) => stockTransferApi.createTransfer(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEYS.history() });
      queryClient.invalidateQueries({
        queryKey: STOCK_TRANSFER_KEYS.itemLocations(variables.itemId),
      });
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEYS.items() });
    },
  });
}
