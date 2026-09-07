import apiClient from '../../api/apiClient';

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  quantity: number;
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

interface BackendItem {
  id: string;
  itemCode: string;
  name: string;
  totalQuantity?: number;
  category?: { name: string } | string;
}

interface BackendStockIssue {
  id: string;
  referenceNumber?: string;
  inventoryItemId: string;
  inventoryItem?: { name: string; itemCode: string };
  quantity: number;
  warehouseId: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  user?: { firstName: string; lastName: string; department?: string | null };
}

export const stockIssuingApi = {
  getInventoryItems: async (): Promise<InventoryItem[]> => {
    try {
      const res = await apiClient.get<{ status: string; data: BackendItem[] }>('/inventory/items');
      const items = res.data?.data || [];
      return items.map((i) => ({
        id: i.id,
        itemCode: i.itemCode,
        name: i.name,
        quantity: i.totalQuantity ?? 0,
        category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
        unit: 'Units',
      }));
    } catch {
      return [];
    }
  },


  getRequisitions: async (): Promise<Requisition[]> => {
    try {
      const res = await apiClient.get<{ status: string; data: BackendStockIssue[] }>(
        '/stock-issuing'
      );
      const issues = res.data?.data || [];
      return issues.map((issue) => ({
        id: issue.id,
        requisitionNumber: issue.referenceNumber || `SIV-${issue.id.slice(0, 8)}`,
        requesterId: issue.user?.firstName || 'unknown',
        requesterName: issue.user
          ? `${issue.user.firstName} ${issue.user.lastName}`
          : 'Unknown User',
        department: issue.user?.department || 'General',
        items: [
          {
            itemId: issue.inventoryItemId,
            itemName: issue.inventoryItem?.name || 'Item',
            quantityRequested: issue.quantity,
          },
        ],
        justification: '',
        status: (issue.status as Requisition['status']) || 'ISSUED',
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        issuedAt: issue.createdAt,
        sivNumber: issue.referenceNumber,
      }));
    } catch {
      return [];
    }
  },

  createRequisition: async (data: {
    requesterId: string;
    requesterName: string;
    department: string;
    items: { itemId: string; quantityRequested: number }[];
    justification: string;
  }): Promise<Requisition> => {
    // Issue each item — backend issues one item at a time
    const results: BackendStockIssue[] = [];
    for (const item of data.items) {
      const res = await apiClient.post<{ status: string; data: BackendStockIssue }>(
        '/stock-issuing',
        {
          inventoryItemId: item.itemId,
          quantity: item.quantityRequested,
          isApproved: false,
        }
      );
      results.push(res.data.data);
    }
    const first = results[0];
    return {
      id: first.id,
      requisitionNumber: first.referenceNumber || `REQ-${Date.now()}`,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      department: data.department,
      items: data.items.map((i) => ({
        itemId: i.itemId,
        itemName: 'Item',
        quantityRequested: i.quantityRequested,
      })),
      justification: data.justification,
      status: 'PENDING',
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
    };
  },

  approveRequisition: async (id: string, _approvedBy?: string): Promise<Requisition> => {
    void _approvedBy;
    const res = await apiClient.put<{ status: string; data: BackendStockIssue }>(
      `/stock-issuing/${id}/approve`
    );
    const issue = res.data.data;
    return {
      id: issue.id,
      requisitionNumber: issue.referenceNumber || id,
      requesterId: '',
      requesterName: '',
      department: '',
      items: [],
      justification: '',
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  },

  rejectRequisition: async (
    id: string,
    params: { rejectedBy: string; reason: string }
  ): Promise<Requisition> => {
    const res = await apiClient.put<{ status: string; data: BackendStockIssue }>(
      `/stock-issuing/${id}/reject`,
      { reason: params.reason }
    );
    const issue = res.data.data;
    return {
      id: issue.id,
      requisitionNumber: issue.referenceNumber || id,
      requesterId: '',
      requesterName: '',
      department: '',
      items: [],
      justification: '',
      status: 'REJECTED',
      rejectionReason: params.reason,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  },

  issueRequisition: async (id: string, _issuedBy?: string): Promise<Requisition> => {
    void _issuedBy;
    const res = await apiClient.post<{ status: string; data: BackendStockIssue }>(
      `/stock-issuing/${id}/issue`
    );
    const issue = res.data.data;
    return {
      id: issue.id,
      requisitionNumber: issue.referenceNumber || id,
      requesterId: '',
      requesterName: '',
      department: '',
      items: [],
      justification: '',
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
      sivNumber: issue.referenceNumber,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  },
};
