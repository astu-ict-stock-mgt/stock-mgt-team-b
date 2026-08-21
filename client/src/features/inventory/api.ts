// client/src/features/inventory/api.ts

import axios from 'axios';

// ============================================================
// TYPES
// ============================================================

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  totalValue: number;
  minStock?: number;
  maxStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLot {
  id: string;
  itemId: string;
  receivedDate: string;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  totalCost: number;
  expiryDate?: string;
  supplierId?: string;
  createdAt: string;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// API BASE
// ============================================================

const API_BASE = '/api';

// ============================================================
// API FUNCTIONS
// ============================================================

export const inventoryApi = {
  // Get all inventory items with pagination and search
  getAll: async (filters?: InventoryFilters): Promise<PaginatedResponse<InventoryItem>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', String(filters.page || 1));
    if (filters?.limit) params.append('limit', String(filters.limit || 10));
    
    const response = await axios.get(`${API_BASE}/inventory?${params.toString()}`);
    return response.data;
  },

  // Get a single inventory item by ID
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await axios.get(`${API_BASE}/inventory/${id}`);
    return response.data;
  },

  // Get lots for a specific item (for detail view)
  getLotsByItemId: async (itemId: string): Promise<InventoryLot[]> => {
    const response = await axios.get(`${API_BASE}/inventory/${itemId}/lots`);
    return response.data;
  },

  // Create new inventory item
  create: async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await axios.post(`${API_BASE}/inventory`, data);
    return response.data;
  },

  // Update inventory item
  update: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await axios.put(`${API_BASE}/inventory/${id}`, data);
    return response.data;
  },

  // Delete inventory item
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_BASE}/inventory/${id}`);
    return response.data;
  },

  // Get categories for filter
  getCategories: async (): Promise<string[]> => {
    const response = await axios.get(`${API_BASE}/inventory/categories`);
    return response.data;
  },
};

// ============================================================
// REACT QUERY KEYS
// ============================================================

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters?: any) => [...inventoryKeys.lists(), { filters }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  lots: (itemId: string) => [...inventoryKeys.detail(itemId), 'lots'] as const,
};