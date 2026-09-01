import { apiClient } from '../../api/apiClient';
import type { Supplier, CreateSupplierDto } from './types';

export async function fetchSuppliers(
  searchQuery?: string,
  isActive?: boolean
): Promise<Supplier[]> {
  const params: Record<string, string | boolean> = {};
  if (searchQuery) params.search = searchQuery;
  if (isActive !== undefined) params.isActive = isActive;

  const response = await apiClient.get<{ status: string; data: Supplier[] }>('/api/suppliers', {
    params,
  });
  return response.data.data;
}

export async function createSupplier(data: CreateSupplierDto): Promise<Supplier> {
  const response = await apiClient.post<{ status: string; data: Supplier }>('/api/suppliers', data);
  return response.data.data;
}

export async function updateSupplier(
  id: string,
  data: Partial<CreateSupplierDto>
): Promise<Supplier> {
  const response = await apiClient.put<{ status: string; data: Supplier }>(
    `/api/suppliers/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/api/suppliers/${id}`);
}
