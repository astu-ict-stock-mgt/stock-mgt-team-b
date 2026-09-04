import { apiClient } from '../../api/apiClient';
import type { Supplier, CreateSupplierDto } from './types';

export async function fetchSuppliers(
  searchQuery?: string,
  isActive?: boolean
): Promise<Supplier[]> {
  const params: Record<string, string | boolean> = {};
  if (searchQuery) params.search = searchQuery;
  if (isActive !== undefined) params.isActive = isActive;

  const response = await apiClient.get<{ status: string; data: Supplier[] }>('/suppliers', {
    params,
  });
  return response.data.data;
}

export async function createSupplier(data: CreateSupplierDto): Promise<Supplier> {
  const payload = {
    name: data.name.trim(),
    contactName: data.contactName?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
  };
  const response = await apiClient.post<{ status: string; data: Supplier }>('/suppliers', payload);
  return response.data.data;
}

export async function updateSupplier(
  id: string,
  data: Partial<CreateSupplierDto>
): Promise<Supplier> {
  const payload = {
    ...data,
    name: data.name?.trim(),
    contactName: data.contactName ? data.contactName.trim() || undefined : undefined,
    phone: data.phone ? data.phone.trim() || undefined : undefined,
    email: data.email ? data.email.trim() || undefined : undefined,
    address: data.address ? data.address.trim() || undefined : undefined,
  };
  const response = await apiClient.put<{ status: string; data: Supplier }>(
    `/suppliers/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`);
}
