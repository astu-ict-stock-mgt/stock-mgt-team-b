import apiClient from '../../api/apiClient';
import type { User, CreateUserDto, UpdateUserDto, PaginatedUsers, FetchUsersParams } from './types';

export class ApiError extends Error {
  field?: string;
  statusCode?: number;

  constructor(message: string, field?: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.field = field;
    this.statusCode = statusCode;
  }
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<PaginatedUsers> {
  const { search = '', role = '', page = 1, pageSize = 10 } = params;
  const queryParams: Record<string, string> = {};

  if (search && search.trim()) {
    queryParams.search = search.trim();
  }
  if (role) {
    queryParams.role = role;
  }

  const res = await apiClient.get<{ status: string; data: User[] }>('/users', {
    params: queryParams,
  });

  const allUsers: User[] = (res.data?.data || []).map((u) => ({
    ...u,
    status: u.status || 'ACTIVE',
  }));

  const totalCount = allUsers.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedData = allUsers.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    totalCount,
    page,
    pageSize,
  };
}

export async function fetchUserById(id: string): Promise<User> {
  const res = await apiClient.get<{ status: string; data: User }>(`/users/${id}`);
  return {
    ...res.data.data,
    status: res.data.data.status || 'ACTIVE',
  };
}

export async function createUser(data: CreateUserDto): Promise<User> {
  const payload = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: data.role,
    department: data.department ? data.department.trim() : null,
  };

  const res = await apiClient.post<{ status: string; data: User }>('/users', payload);
  return {
    ...res.data.data,
    status: res.data.data.status || 'ACTIVE',
  };
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  const payload: Record<string, unknown> = {};

  if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
  if (data.firstName !== undefined) payload.firstName = data.firstName.trim();
  if (data.lastName !== undefined) payload.lastName = data.lastName.trim();
  if (data.role !== undefined) payload.role = data.role;
  if (data.department !== undefined) {
    payload.department = data.department ? data.department.trim() : null;
  }
  if (data.password && data.password.trim()) {
    payload.password = data.password;
  }

  const res = await apiClient.put<{ status: string; data: User }>(`/users/${id}`, payload);
  return {
    ...res.data.data,
    status: res.data.data.status || 'ACTIVE',
  };
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
