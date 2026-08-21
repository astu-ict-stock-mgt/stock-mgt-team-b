import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from './api';
import type { CreateSupplierDto } from './types';

export function useSuppliers(searchQuery: string = '', page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['suppliers', searchQuery, page, pageSize],
    queryFn: () => fetchSuppliers(searchQuery, page, pageSize),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierDto) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierDto> }) =>
      updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
