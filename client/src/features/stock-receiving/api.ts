import apiClient from '../../api/apiClient';

export type InspectionStatus = 'Accepted' | 'Rejected';

export type GrnWorkflowStatus =
  | 'DRAFT'
  | 'PENDING_INSPECTION'
  | 'INSPECTED'
  | 'PENDING_PAO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type GrnStatus = 'Accepted' | 'Partially Accepted' | 'Rejected' | GrnWorkflowStatus;

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
}

export interface CreateGrnPayload {
  supplierId: string;
  warehouseId: string;
  receivedDate: string;
  lineItems: GrnLineItemInput[];
}

export interface GrnLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  acceptedQty: number | null;
  damagedQty: number | null;
  inspectorRemarks: string | null;
  inspectionResult: InspectionStatus;
  remarks?: string;
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
  status: GrnWorkflowStatus;
  createdBy: string;
  createdAt: string;
  inspectedBy: string | null;
  inspectedAt: string | null;
  inspectorNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export interface GrnSummary {
  id: string;
  grnNumber: string;
  receivedDate: string;
  supplierName: string;
  warehouseName: string;
  totalValue: number;
  status: GrnWorkflowStatus;
  inspectedBy: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const res = await apiClient.get<{ status: string; data: Array<{ id: string; name: string }> }>(
      '/suppliers'
    );
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  try {
    const res = await apiClient.get<{ status: string; data: Array<{ id: string; name: string }> }>(
      '/inventory/warehouses'
    );
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function searchItems(query: string): Promise<InventoryItem[]> {
  try {
    const res = await apiClient.get<{
      status: string;
      data: Array<{ id: string; itemCode: string; name: string }>;
    }>('/inventory/items', {
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

export async function fetchGrns(statusFilter?: GrnWorkflowStatus): Promise<GrnSummary[]> {
  try {
    const res = await apiClient.get<{ status: string; data: GrnSummary[] }>('/grns', {
      params: statusFilter ? { status: statusFilter } : undefined,
    });
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchGrn(id: string): Promise<Grn> {
  const res = await apiClient.get<{ status: string; data: Grn }>(`/grns/${id}`);
  return res.data.data;
}

export async function createQuickSupplier(payload: {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
}): Promise<Supplier> {
  const res = await apiClient.post<{ status: string; data: Supplier }>('/suppliers', payload);
  return res.data.data;
}

export async function createQuickWarehouse(payload: {
  name: string;
  location?: string;
}): Promise<Warehouse> {
  const res = await apiClient.post<{ status: string; data: Warehouse }>(
    '/inventory/warehouses',
    payload
  );
  return res.data.data;
}

export async function createGrn(payload: CreateGrnPayload): Promise<Grn> {
  const res = await apiClient.post<{ status: string; data: Grn }>('/grns', payload);
  return res.data.data;
}

// ─── Workflow action APIs ─────────────────────────────────────────────────────

export async function sendGrnToInspection(id: string): Promise<Grn> {
  const res = await apiClient.put<{ status: string; data: Grn }>(`/grns/${id}/send-to-inspection`);
  return res.data.data;
}

export interface InspectionItemResult {
  itemId: string;
  acceptedQty: number;
  damagedQty: number;
  inspectorRemarks?: string;
}

export async function submitGrnInspection(
  id: string,
  items: InspectionItemResult[],
  inspectorNotes?: string
): Promise<Grn> {
  const res = await apiClient.put<{ status: string; data: Grn }>(`/grns/${id}/inspect`, {
    items,
    inspectorNotes,
  });
  return res.data.data;
}

export async function confirmGrnRouting(id: string): Promise<Grn> {
  const res = await apiClient.put<{ status: string; data: Grn }>(`/grns/${id}/confirm-routing`);
  return res.data.data;
}

export async function approveGrn(id: string): Promise<Grn> {
  const res = await apiClient.put<{ status: string; data: Grn }>(`/grns/${id}/approve`);
  return res.data.data;
}

export async function rejectGrn(id: string, reason: string): Promise<Grn> {
  const res = await apiClient.put<{ status: string; data: Grn }>(`/grns/${id}/reject`, {
    reason,
  });
  return res.data.data;
}
