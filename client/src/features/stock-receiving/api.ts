import apiClient from '../../api/apiClient';

export type InspectionStatus = 'Accepted' | 'Rejected';

export interface Supplier {
  id: string;
  name: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantityOnHand: number;
}

export interface GrnLineItemInput {
  itemId: string;
  quantity: number;
  unitCost: number;
  inspectionResult: InspectionStatus | null;
  remarks?: string;
}

export interface CreateGrnPayload {
  supplierId: string;
  warehouseId: string;
  receivedDate: string;
  lineItems: GrnLineItemInput[];
  createdBy?: string;
}

export type GrnStatus = 'Accepted' | 'Rejected' | 'Partially Accepted';

export interface GrnLineItem extends GrnLineItemInput {
  id: string;
  itemName: string;
  itemSku: string;
  unit: string;
  lineTotal: number;
}

export interface Grn {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receivedDate: string;
  lineItems: GrnLineItem[];
  totalValue: number;
  status: GrnStatus;
  createdBy: string;
  createdAt: string;
}

export interface GrnSummary {
  id: string;
  grnNumber: string;
  receivedDate: string;
  supplierName: string;
  totalValue: number;
  status: GrnStatus;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const res = await apiClient.get<{ status: string; data: Array<{ id: string; name: string }> }>('/suppliers');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  try {
    const res = await apiClient.get<{ status: string; data: Array<{ id: string; name: string }> }>('/inventory/warehouses');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function searchItems(query: string): Promise<InventoryItem[]> {
  try {
    const res = await apiClient.get<{ status: string; data: Array<{ id: string; itemCode: string; name: string }> }>('/inventory/items', {
      params: { search: query },
    });
    const items = res.data?.data || [];
    return items.map((i) => ({
      id: i.id,
      sku: i.itemCode,
      name: i.name,
      unit: 'Units',
      quantityOnHand: 0,
    }));
  } catch {
    return [];
  }
}

export async function fetchGrns(): Promise<GrnSummary[]> {
  try {
    const res = await apiClient.get<{ status: string; data: GrnSummary[] }>('/grns');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchGrn(id: string): Promise<Grn> {
  const res = await apiClient.get<{ status: string; data: Grn }>(`/grns/${id}`);
  return res.data.data;
}

export async function createGrn(payload: CreateGrnPayload): Promise<Grn> {
  const res = await apiClient.post<{ status: string; data: Grn }>('/grns', payload);
  return res.data.data;
}
