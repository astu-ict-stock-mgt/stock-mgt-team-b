// client/src/features/damaged-obsolete/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { writeOffApi, writeOffKeys, WriteOffRequest } from './api';

export const useWriteOffHistory = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: writeOffKeys.list(filters),
    queryFn: () => writeOffApi.getAll(filters),
    staleTime: 30000,
  });
};

export const useWriteOffRequest = (id: string) => {
  return useQuery({
    queryKey: writeOffKeys.detail(id),
    queryFn: () => writeOffApi.getById(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: () => writeOffApi.getInventoryItems(),
    staleTime: 60000,
  });
};

export const useCreateWriteOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WriteOffRequest) => writeOffApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: writeOffKeys.lists() });
      window.dispatchEvent(
        new CustomEvent('inventory-update', {
          detail: { type: 'write-off-created', data },
        })
      );
    },
  });
};

export const useApproveWriteOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => writeOffApi.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: writeOffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: writeOffKeys.detail(data.id) });
      window.dispatchEvent(
        new CustomEvent('inventory-update', {
          detail: { type: 'write-off-approved', data },
        })
      );
    },
  });
};

export const useRejectWriteOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      writeOffApi.reject(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: writeOffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: writeOffKeys.detail(data.id) });
      window.dispatchEvent(
        new CustomEvent('inventory-update', {
          detail: { type: 'write-off-rejected', data },
        })
      );
    },
  });
};

export const useDisposeItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => writeOffApi.dispose(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: writeOffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: writeOffKeys.detail(data.id) });
      window.dispatchEvent(
        new CustomEvent('inventory-update', {
          detail: { type: 'write-off-disposed', data },
        })
      );
    },
  });
};

export const useApprovalAuthority = () => {
  const getUserRole = (): string | null => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      const user = JSON.parse(userString);
      return user.role || null;
    } catch {
      return null;
    }
  };

  const role = getUserRole();
  const authorizedRoles = ['ADMINISTRATOR', 'PAO', 'PROPERTY_ADMINISTRATION_OFFICER'];
  const isAuthorized = role ? authorizedRoles.includes(role) : false;

  return { isAuthorized, userRole: role, loading: false };
};