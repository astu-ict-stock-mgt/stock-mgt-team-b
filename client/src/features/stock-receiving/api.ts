/**
 * Stock Receiving API layer
 * SRS Reference: 4.4.9 - Stock Receiving Page (register goods, verify items, generate receiving notes)
 * Workflow Reference: Steps 5-7 (Receive -> Inspect -> Store)
 */

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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface BackendSupplier {
  id: string;
  name: string;
}

interface BackendWarehouse {
  id: string;
  name: string;
}

interface BackendInventoryItem {
  id?: string;
  sku?: string;
  itemCode?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  totalQuantity?: number;
}

interface BackendGrnItem {
  id?: string;
  inventoryItemId?: string;
  itemId?: string;
  quantity: number;
  unitCost: number;
  inspectionStatus?: string;
  inspectionResult?: string;
  rejectionReason?: string;
  remarks?: string;
  inventoryItem?: {
    name?: string;
    itemCode?: string;
    unit?: string;
  };
  itemName?: string;
  itemSku?: string;
  unit?: string;
}

interface BackendUser {
  firstName?: string;
  lastName?: string;
}

interface BackendGrn {
  id: string;
  grnNumber: string;
  supplierId: string;
  warehouseId: string;
  receivedDate: string;
  supplier?: { name: string };
  supplierName?: string;
  warehouse?: { name: string };
  warehouseName?: string;
  user?: BackendUser;
  createdBy?: string;
  createdAt: string;
  items?: BackendGrnItem[];
}

function calculateStatus(
  items: Array<{ inspectionStatus?: string; inspectionResult?: string }>
): GrnStatus {
  if (!items || items.length === 0) return 'Accepted';
  const acceptedCount = items.filter(
    (i) =>
      (i.inspectionStatus || i.inspectionResult) === 'ACCEPTED' ||
      (i.inspectionStatus || i.inspectionResult) === 'Accepted'
  ).length;

  if (acceptedCount === items.length) return 'Accepted';
  if (acceptedCount === 0) return 'Rejected';
  return 'Partially Accepted';
}

function formatGrnResponse(raw: BackendGrn): Grn {
  const items = raw.items || [];
  const lineItems: GrnLineItem[] = items.map((item: BackendGrnItem) => {
    const isAccepted =
      (item.inspectionStatus || item.inspectionResult) === 'ACCEPTED' ||
      (item.inspectionStatus || item.inspectionResult) === 'Accepted';

    return {
      id: item.id || '',
      itemId: item.inventoryItemId || item.itemId || '',
      itemName: item.inventoryItem?.name || item.itemName || 'Inventory Item',
      itemSku: item.inventoryItem?.itemCode || item.itemSku || 'N/A',
      unit: item.inventoryItem?.unit || item.unit || 'pcs',
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal: item.quantity * item.unitCost,
      inspectionResult: isAccepted ? 'Accepted' : 'Rejected',
      remarks: item.rejectionReason || item.remarks || '',
    };
  });

  const totalValue = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const status = calculateStatus(items);

  return {
    id: raw.id,
    grnNumber: raw.grnNumber,
    supplierId: raw.supplierId,
    supplierName: raw.supplier?.name || raw.supplierName || 'Unknown Supplier',
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouse?.name || raw.warehouseName || 'Main Warehouse',
    receivedDate: raw.receivedDate,
    lineItems,
    totalValue,
    status,
    createdBy: raw.user
      ? `${raw.user.firstName || ''} ${raw.user.lastName || ''}`.trim() || 'Storekeeper'
      : raw.createdBy || 'Storekeeper',
    createdAt: raw.createdAt,
  };
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await apiClient.get<
    { status?: string; data?: BackendSupplier[] } | BackendSupplier[]
  >('/suppliers');
  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data.map((s: BackendSupplier) => ({
    id: s.id,
    name: s.name,
  }));
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await apiClient.get<
    { status?: string; data?: BackendWarehouse[] } | BackendWarehouse[]
  >('/inventory/warehouses');
  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data.map((w: BackendWarehouse) => ({
    id: w.id,
    name: w.name,
  }));
}

export async function searchItems(query: string, warehouseId?: string): Promise<InventoryItem[]> {
  const params: Record<string, string> = {};
  if (query && query.trim()) params.search = query.trim();
  if (warehouseId) params.warehouseId = warehouseId;

  const res = await apiClient.get<
    { status?: string; data?: BackendInventoryItem[] } | BackendInventoryItem[]
  >('/inventory', { params });
  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data.map((i: BackendInventoryItem) => ({
    id: i.id || '',
    sku: i.sku || i.itemCode || '',
    name: i.name || '',
    unit: i.unit || 'pcs',
    quantityOnHand: i.quantity ?? i.totalQuantity ?? 0,
  }));
}

export async function fetchGrns(): Promise<GrnSummary[]> {
  const res = await apiClient.get<{ status?: string; data?: BackendGrn[] } | BackendGrn[]>(
    '/stock-receiving'
  );
  const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return list.map((g: BackendGrn) => {
    const items = g.items || [];
    const totalValue = items.reduce(
      (sum: number, it: BackendGrnItem) => sum + (it.quantity || 0) * (it.unitCost || 0),
      0
    );
    return {
      id: g.id,
      grnNumber: g.grnNumber,
      receivedDate: g.receivedDate,
      supplierName: g.supplier?.name || g.supplierName || 'Unknown Supplier',
      totalValue,
      status: calculateStatus(items),
    };
  });
}

export async function fetchGrn(id: string): Promise<Grn> {
  const res = await apiClient.get<{ status?: string; data?: BackendGrn } | BackendGrn>(
    `/stock-receiving/${id}`
  );
  const raw =
    res.data && 'data' in res.data && res.data.data ? res.data.data : (res.data as BackendGrn);
  return formatGrnResponse(raw);
}

export async function createGrn(payload: CreateGrnPayload): Promise<Grn> {
  const backendPayload = {
    supplierId: payload.supplierId,
    warehouseId: payload.warehouseId,
    receivedDate: payload.receivedDate,
    items: payload.lineItems.map((item) => ({
      inventoryItemId: item.itemId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      inspectionStatus: item.inspectionResult === 'Rejected' ? 'REJECTED' : 'ACCEPTED',
      rejectionReason: item.remarks || undefined,
    })),
  };

  const res = await apiClient.post<{ status?: string; data?: BackendGrn } | BackendGrn>(
    '/stock-receiving',
    backendPayload
  );
  const raw =
    res.data && 'data' in res.data && res.data.data ? res.data.data : (res.data as BackendGrn);
  return formatGrnResponse(raw);
}
