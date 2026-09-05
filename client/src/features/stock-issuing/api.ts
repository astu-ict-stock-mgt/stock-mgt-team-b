// client/src/features/stock-issuing/api.ts

import apiClient from '../../api/apiClient';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  quantity: number; // Available stock
  category: string;
  unit: string;
}

export interface RequisitionItem {
  itemId: string;
  itemName: string;
  quantityRequested: number;
}

export interface Requisition {
  id: string;
  requisitionNumber: string;
  requesterId: string;
  requesterName: string;
  requestedBy?: string;
  department: string;
  items: RequisitionItem[];
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedAt?: string;
  sivNumber?: string;
}

export interface CreateRequisitionPayload {
  department: string;
  justification: string;
  items: { itemId: string; quantityRequested: number }[];
  requesterId?: string;
  requesterName?: string;
}

export interface IssueHistoryItem {
  id: string;
  sivNumber: string;
  issueDate: string;
  item: string;
  itemCode: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number;
  warehouse: string;
  issuedTo: string;
  issuedBy: string;
  status: string;
}

// ============================================================
// API SERVICE LAYER
// ============================================================

export const stockIssuingApi = {
  // Get inventory items available for requisitions
  getInventoryItems: async (): Promise<InventoryItem[]> => {
    const res = await apiClient.get<InventoryItem[]>('/stock-issuing/items');
    return res.data;
  },

  // Get requisitions (filtered by status or all)
  getRequisitions: async (statusFilter?: string): Promise<Requisition[]> => {
    const params = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
    const res = await apiClient.get<Requisition[]>('/stock-issuing/requisitions', { params });
    return (res.data || []).map((r) => ({
      ...r,
      requesterName:
        (r as unknown as { requestedBy?: string }).requestedBy ||
        r.requesterName ||
        'Department User',
    }));
  },

  // Create requisition (Department Head / Requester)
  createRequisition: async (data: CreateRequisitionPayload): Promise<Requisition> => {
    const res = await apiClient.post<Requisition>('/stock-issuing/requisitions', {
      department: data.department,
      justification: data.justification,
      items: data.items.map((i) => ({
        itemId: i.itemId,
        quantityRequested: i.quantityRequested,
      })),
    });
    const r = res.data;
    return {
      ...r,
      requesterName:
        (r as unknown as { requestedBy?: string }).requestedBy ||
        r.requesterName ||
        data.requesterName ||
        'Department User',
    };
  },

  // Approve requisition (PAO / Approver)
  approveRequisition: async (id: string, approvedBy?: string): Promise<Requisition> => {
    const res = await apiClient.patch<Requisition>(`/stock-issuing/requisitions/${id}/approve`);
    const r = res.data;
    return {
      ...r,
      approvedBy: r.approvedBy || approvedBy,
      requesterName:
        (r as unknown as { requestedBy?: string }).requestedBy ||
        r.requesterName ||
        'Department User',
    };
  },

  // Reject requisition (PAO / Approver)
  rejectRequisition: async (
    id: string,
    params: { rejectedBy?: string; reason: string }
  ): Promise<Requisition> => {
    const res = await apiClient.patch<Requisition>(`/stock-issuing/requisitions/${id}/reject`, {
      reason: params.reason,
    });
    const r = res.data;
    return {
      ...r,
      requesterName:
        (r as unknown as { requestedBy?: string }).requestedBy ||
        r.requesterName ||
        'Department User',
    };
  },

  // Issue stock (Storekeeper)
  issueRequisition: async (
    id: string,
    issuedBy?: string,
    warehouseId?: string
  ): Promise<Requisition> => {
    const res = await apiClient.post<Requisition>(`/stock-issuing/requisitions/${id}/issue`, {
      warehouseId,
    });
    const r = res.data;
    return {
      ...r,
      issuedBy: r.issuedBy || issuedBy,
      requesterName:
        (r as unknown as { requestedBy?: string }).requestedBy ||
        r.requesterName ||
        'Department User',
    };
  },

  // Get issuing transaction history
  getIssueHistory: async (): Promise<IssueHistoryItem[]> => {
    const res = await apiClient.get<IssueHistoryItem[]>('/stock-issuing/history');
    return res.data;
  },
};
