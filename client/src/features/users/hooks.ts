import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, fetchUserById, createUser, updateUser, deleteUser } from './api';
import type { CreateUserDto, UpdateUserDto, FetchUsersParams, User } from './types';

export const USERS_QUERY_KEY = ['users'];

export function useGetUsers(params: FetchUsersParams = {}) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => fetchUsers(params),
  });
}

export function useGetUser(id: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, id],
    queryFn: () => fetchUserById(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newUser: CreateUserDto) => createUser(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: User) =>
      updateUser(user.id, {
        status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
