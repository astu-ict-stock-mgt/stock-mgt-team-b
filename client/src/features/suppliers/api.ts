import type { Supplier, CreateSupplierDto } from './types';

// Mocked data since backend is not ready
let mockSuppliers: Supplier[] = [
  {
    supplierId: 'SPL-1002',
    companyName: 'Afritech Solutions Ltd',
    contactPerson: 'Nuhu Bello',
    businessPhone: '+234 803 1234',
    contactEmail: 'procurement@afritech.com',
    status: 'Active',
  },
  {
    supplierId: 'SPL-1024',
    companyName: 'Global Office Logistics',
    contactPerson: 'Emily Vance',
    businessPhone: '+1 415 982 1042',
    contactEmail: 'orders@globalofficelog.com',
    status: 'Active',
  },
  {
    supplierId: 'SPL-1049',
    companyName: 'Broadband Backbone Inc',
    contactPerson: 'Abigail Stone',
    businessPhone: '+1 212 555 0199',
    contactEmail: 'networks@broadbandbackbone.net',
    status: 'Active',
  },
  {
    supplierId: 'SPL-1082',
    companyName: 'Power Tech Distributors',
    contactPerson: 'John Doe',
    businessPhone: '+44 20 7946 0958',
    contactEmail: 'supply@powertechdist.co.uk',
    status: 'Inactive',
  },
  {
    supplierId: 'SPL-1104',
    companyName: 'Fibers & Cables Corp',
    contactPerson: 'Aishat Yusuf',
    businessPhone: '+234 815 9876',
    contactEmail: 'accounts@fibersandcables.com',
    status: 'Active',
  },
  {
    supplierId: 'SPL-1140',
    companyName: 'Smart Seating Systems',
    contactPerson: 'Marcus Vance',
    businessPhone: '+1 312 555 4242',
    contactEmail: 'logistics@smartseatingsystems.com',
    status: 'Active',
  },
];

export interface PaginatedSuppliers {
  data: Supplier[];
  totalCount: number;
}

export async function fetchSuppliers(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedSuppliers> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let result = mockSuppliers;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (s) =>
        s.companyName.toLowerCase().includes(query) ||
        s.contactPerson.toLowerCase().includes(query) ||
        s.contactEmail.toLowerCase().includes(query)
    );
  }

  const totalCount = result.length;
  const start = (page - 1) * pageSize;
  const paginatedData = result.slice(start, start + pageSize);

  return { data: paginatedData, totalCount };
}

export async function createSupplier(data: CreateSupplierDto): Promise<Supplier> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newSupplier: Supplier = {
    ...data,
    supplierId: `SPL-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  mockSuppliers = [newSupplier, ...mockSuppliers];
  return newSupplier;
}

export async function updateSupplier(
  id: string,
  data: Partial<CreateSupplierDto>
): Promise<Supplier> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const index = mockSuppliers.findIndex((s) => s.supplierId === id);
  if (index === -1) throw new Error('Supplier not found');

  mockSuppliers[index] = { ...mockSuppliers[index], ...data };
  return mockSuppliers[index];
}

export async function deleteSupplier(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  mockSuppliers = mockSuppliers.filter((s) => s.supplierId !== id);
}
