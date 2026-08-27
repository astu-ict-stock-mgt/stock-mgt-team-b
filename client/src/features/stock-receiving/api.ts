/**
 * Stock Receiving API layer
 * SRS Reference: 4.4.9 - Stock Receiving Page (register goods, verify items, generate receiving notes)
 * Workflow Reference: Steps 5-7 (Receive -> Inspect -> Store)
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? '/api';

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
  unit: string; // e.g. "pcs", "box", "kg"
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
  receivedDate: string; // ISO date
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

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // response had no JSON body - keep default message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchSuppliers(): Promise<Supplier[]> {
  return request<Supplier[]>('/suppliers');
}

export function fetchWarehouses(): Promise<Warehouse[]> {
  return request<Warehouse[]>('/warehouses');
}

export function searchItems(query: string): Promise<InventoryItem[]> {
  const params = new URLSearchParams({ q: query });
  return request<InventoryItem[]>(`/items?${params.toString()}`);
}

export function fetchGrns(): Promise<GrnSummary[]> {
  return request<GrnSummary[]>('/grns');
}

export function fetchGrn(id: string): Promise<Grn> {
  return request<Grn>(`/grns/${id}`);
}

export function createGrn(payload: CreateGrnPayload): Promise<Grn> {
  return request<Grn>('/grns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { ApiError };
