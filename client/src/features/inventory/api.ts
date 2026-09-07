import apiClient from '../../api/apiClient';

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

interface BackendItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string | null;
  minLevel?: number;
  maxLevel?: number;
  totalQuantity?: number;
  totalValue?: number;
  category?: { name: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

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

    try {
      const response = await apiClient.get<{ status: string; data: BackendItem[] }>(
        `/inventory/items?${params.toString()}`
      );
      const rawList = response.data?.data || [];
      const mapped: InventoryItem[] = rawList.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.itemCode,
        category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
        quantity: i.totalQuantity ?? 0,
        unit: 'Units',
        totalValue: i.totalValue ?? 0,
        minStock: i.minLevel,
        maxStock: i.maxLevel,
        createdAt: i.createdAt || new Date().toISOString(),
        updatedAt: i.updatedAt || new Date().toISOString(),
      }));

      return {
        data: mapped,
        total: mapped.length,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        totalPages: Math.ceil(mapped.length / (filters?.limit || 10)) || 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    }
  },

  // Get a single inventory item by ID
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get<{ status: string; data: BackendItem }>(
      `/inventory/items/${id}`
    );
    const i = response.data.data;
    return {
      id: i.id,
      name: i.name,
      sku: i.itemCode,
      category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
      quantity: i.totalQuantity ?? 0,
      unit: 'Units',
      totalValue: i.totalValue ?? 0,
      minStock: i.minLevel,
      maxStock: i.maxLevel,
      createdAt: i.createdAt || new Date().toISOString(),
      updatedAt: i.updatedAt || new Date().toISOString(),
    };
  },


  // Get lots for a specific item (for detail view)
  getLotsByItemId: async (itemId: string): Promise<InventoryLot[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: InventoryLot[] }>(
        `/inventory/items/${itemId}/lots`
      );
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  // Create new inventory item
  create: async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiClient.post<{ status: string; data: BackendItem }>(
      '/inventory/items',
      {
        itemCode: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
        name: data.name,
        description: data.category,
        minLevel: data.minStock || 0,
        maxLevel: data.maxStock || 0,
      }
    );
    const i = response.data.data;
    return {
      id: i.id,
      name: i.name,
      sku: i.itemCode,
      category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
      quantity: 0,
      unit: 'Units',
      totalValue: 0,
      createdAt: i.createdAt || new Date().toISOString(),
      updatedAt: i.updatedAt || new Date().toISOString(),
    };
  },

  // Update inventory item
  update: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiClient.put<{ status: string; data: BackendItem }>(
      `/inventory/items/${id}`,
      {
        name: data.name,
        minLevel: data.minStock,
        maxLevel: data.maxStock,
      }
    );
    const i = response.data.data;
    return {
      id: i.id,
      name: i.name,
      sku: i.itemCode,
      category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
      quantity: 0,
      unit: 'Units',
      totalValue: 0,
      createdAt: i.createdAt || new Date().toISOString(),
      updatedAt: i.updatedAt || new Date().toISOString(),
    };
  },

  // Delete inventory item
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/inventory/items/${id}`);
    return response.data;
  },

  // Get categories for filter
  getCategories: async (): Promise<string[]> => {
    return ['General', 'Office Supplies', 'IT Equipment', 'Furniture'];
  },
};

// ============================================================
// REACT QUERY KEYS
// ============================================================

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters?: InventoryFilters) => [...inventoryKeys.lists(), { filters }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  lots: (itemId: string) => [...inventoryKeys.detail(itemId), 'lots'] as const,
};
