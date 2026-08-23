// client/src/features/damaged-obsolete/api.ts

import axios from 'axios';

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

const API_BASE = '/api';

export const writeOffApi = {
  create: async (data: WriteOffRequest): Promise<WriteOffResponse> => {
    const response = await axios.post(`${API_BASE}/write-off`, {
      ...data,
      requestedAt: new Date().toISOString(),
    });
    return response.data;
  },

  getAll: async (params?: { status?: string }): Promise<WriteOffResponse[]> => {
    const response = await axios.get(`${API_BASE}/write-off`, { params });
    return response.data;
  },

  getById: async (id: string): Promise<WriteOffResponse> => {
    const response = await axios.get(`${API_BASE}/write-off/${id}`);
    return response.data;
  },

  approve: async (id: string): Promise<WriteOffResponse> => {
    const response = await axios.put(`${API_BASE}/write-off/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<WriteOffResponse> => {
    const response = await axios.put(`${API_BASE}/write-off/${id}/reject`, { reason });
    return response.data;
  },

  dispose: async (id: string): Promise<WriteOffResponse> => {
    const response = await axios.put(`${API_BASE}/write-off/${id}/dispose`);
    return response.data;
  },

  getInventoryItems: async (): Promise<InventoryItem[]> => {
    const response = await axios.get(`${API_BASE}/inventory/items`);
    return response.data;
  },
};

export const writeOffKeys = {
  all: ['write-off'] as const,
  lists: () => [...writeOffKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...writeOffKeys.lists(), { filters }] as const,
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
