import apiClient from '../../api/apiClient';
import type { Supplier, CreateSupplierDto } from './types';

interface BackendSupplier {
  id: string;
  supplierCode?: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapBackendSupplier(s: BackendSupplier): Supplier {
  return {
    supplierId: s.id,
    companyName: s.name,
    contactPerson: s.contactPerson || '',
    businessPhone: s.phone || '',
    contactEmail: s.email || '',
    status: s.isActive ? 'Active' : 'Inactive',
  };
}

export interface PaginatedSuppliers {
  data: Supplier[];
  totalCount: number;
}

export async function fetchSuppliers(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedSuppliers> {
  try {
    const res = await apiClient.get<{ status: string; data: BackendSupplier[] }>('/suppliers', {
      params: { search: searchQuery, page, limit: pageSize },
    });
    const raw = res.data?.data || [];
    const mapped = raw.map(mapBackendSupplier);

    // Apply client-side search filtering if backend doesn't filter
    let result = mapped;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = mapped.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.contactEmail.toLowerCase().includes(q)
      );
    }

    const totalCount = result.length;
    const start = (page - 1) * pageSize;
    const paginatedData = result.slice(start, start + pageSize);
    return { data: paginatedData, totalCount };
  } catch {
    return { data: [], totalCount: 0 };
  }
}

export async function createSupplier(data: CreateSupplierDto): Promise<Supplier> {
  const res = await apiClient.post<{ status: string; data: BackendSupplier }>('/suppliers', {
    name: data.companyName,
    contactPerson: data.contactPerson,
    phone: data.businessPhone,
    email: data.contactEmail,
    isActive: data.status === 'Active',
  });
  return mapBackendSupplier(res.data.data);
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierDto>): Promise<Supplier> {
  const res = await apiClient.put<{ status: string; data: BackendSupplier }>(`/suppliers/${id}`, {
    name: data.companyName,
    contactPerson: data.contactPerson,
    phone: data.businessPhone,
    email: data.contactEmail,
    isActive: data.status === 'Active',
  });
  return mapBackendSupplier(res.data.data);
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`);
}
