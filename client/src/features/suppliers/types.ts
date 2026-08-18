export interface Supplier {
  supplierId: string;
  companyName: string;
  contactPerson: string;
  businessPhone: string;
  contactEmail: string;
  status: 'Active' | 'Inactive';
}

export interface CreateSupplierDto {
  companyName: string;
  contactPerson: string;
  businessPhone: string;
  contactEmail: string;
  status: 'Active' | 'Inactive';
}
