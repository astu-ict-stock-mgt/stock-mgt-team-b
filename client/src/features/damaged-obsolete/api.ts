import apiClient from '../../api/apiClient';

// Types
export interface WriteOffRequest {
  id?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reasonCode: 'DAMAGED' | 'OBSOLETE' | 'EXPIRED' | 'OTHER';
  reasonDescription?: string;
  notes?: string;
  requestedBy?: string;
  requestedAt?: string;
}

export interface WriteOffResponse {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reasonCode: string;
  reasonDescription?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPOSED';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  disposedBy?: string;
  disposedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  category: string;
  unit: string;
}

const API_BASE = '/write-off';

export const writeOffApi = {
  create: async (data: WriteOffRequest): Promise<WriteOffResponse> => {
    const response = await apiClient.post<{ status: string; data: WriteOffResponse }>(API_BASE, {
      ...data,
      requestedAt: new Date().toISOString(),
    });
    return response.data.data;
  },

  getAll: async (params?: { status?: string }): Promise<WriteOffResponse[]> => {
    const response = await apiClient.get<{ status: string; data: WriteOffResponse[] }>(API_BASE, { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<WriteOffResponse> => {
    const response = await apiClient.get<{ status: string; data: WriteOffResponse }>(`${API_BASE}/${id}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<WriteOffResponse> => {
    const response = await apiClient.put<{ status: string; data: WriteOffResponse }>(`${API_BASE}/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, reason?: string): Promise<WriteOffResponse> => {
    const response = await apiClient.put<{ status: string; data: WriteOffResponse }>(`${API_BASE}/${id}/reject`, { reason });
    return response.data.data;
  },

  dispose: async (id: string): Promise<WriteOffResponse> => {
    const response = await apiClient.put<{ status: string; data: WriteOffResponse }>(`${API_BASE}/${id}/dispose`);
    return response.data.data;
  },

  getInventoryItems: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<{ status: string; data: Array<{ id: string; name: string; itemCode: string }> }>('/inventory/items');
    const list = response.data.data || [];
    return list.map((i) => ({
      id: i.id,
      name: i.name,
      code: i.itemCode,
      quantity: 0,
      category: 'General',
      unit: 'Units',
    }));
  },
};

export const writeOffKeys = {
  all: ['write-off'] as const,
  lists: () => [...writeOffKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => [...writeOffKeys.lists(), { filters }] as const,
  details: () => [...writeOffKeys.all, 'detail'] as const,
  detail: (id: string) => [...writeOffKeys.details(), id] as const,
};

export const getReasonCodes = (): Array<{
  code: 'DAMAGED' | 'OBSOLETE' | 'EXPIRED' | 'OTHER';
  label: string;
  description: string;
  icon: string;
}> => {
  return [
    {
      code: 'DAMAGED',
      label: 'Damaged',
      description: 'Physically damaged and unusable',
      icon: '🔨',
    },
    {
      code: 'OBSOLETE',
      label: 'Obsolete',
      description: 'No longer needed or outdated',
      icon: '📅',
    },
    { code: 'EXPIRED', label: 'Expired', description: 'Passed expiration date', icon: '⏰' },
    { code: 'OTHER', label: 'Other', description: 'Other reasons for write-off', icon: '📝' },
  ];
};

export const getStatusConfig = (status: string) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      dot: 'bg-yellow-400',
      label: 'Pending',
    },
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', label: 'Approved' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', label: 'Rejected' },
    DISPOSED: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Disposed' },
  };
  return config[status] || config.PENDING;
};
