import apiClient from '../../api/apiClient';

export interface Item {
  id: string;
  name: string;
  itemCode: string;
  category: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface ItemStockLocation {
  locationId: string;
  locationName: string;
  availableQuantity: number;
}

export interface TransferRecord {
  id: string;
  itemId: string;
  itemName: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  quantity: number;
  date: string;
  transferredBy: string;
}

export interface CreateTransferPayload {
  itemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  transferredBy?: string;
}

interface BackendItem {
  id: string;
  name: string;
  itemCode: string;
  category?: { name: string } | string;
}

interface BackendTransfer {
  id: string;
  inventoryItemId: string;
  inventoryItem?: { name: string };
  warehouseId: string;
  warehouse?: { name: string };
  quantity: number;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  referenceNumber?: string;
}

export const stockTransferApi = {
  async getItems(): Promise<Item[]> {
    try {
      const res = await apiClient.get<{ status: string; data: BackendItem[] }>('/inventory/items');
      const items = res.data?.data || [];
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        itemCode: i.itemCode,
        category: typeof i.category === 'object' ? i.category.name : i.category || 'General',
      }));
    } catch {
      return [];
    }
  },

  async getLocations(): Promise<Location[]> {
    try {
      const res = await apiClient.get<{
        status: string;
        data: Array<{ id: string; name: string }>;
      }>('/inventory/warehouses');
      return res.data?.data || [];
    } catch {
      return [
        { id: 'main-wh', name: 'Main Warehouse' },
        { id: 'branch-wh', name: 'Branch Warehouse' },
      ];
    }
  },

  async getItemStockLocations(itemId: string): Promise<ItemStockLocation[]> {
    try {
      const res = await apiClient.get<{
        status: string;
        data: { warehouseId: string; currentStock: number };
      }>(`/stock-monitoring/${itemId}`);
      const data = res.data?.data;
      return [
        {
          locationId: data?.warehouseId || 'main-wh',
          locationName: 'Warehouse',
          availableQuantity: data?.currentStock || 0,
        },
      ];
    } catch {
      return [];
    }
  },

  async getTransferHistory(search?: string): Promise<TransferRecord[]> {
    try {
      const res = await apiClient.get<{ status: string; data: BackendTransfer[] }>(
        '/stock-transfers',
        { params: { search } }
      );
      const list = res.data?.data || [];
      return list.map((t) => ({
        id: t.id,
        itemId: t.inventoryItemId,
        itemName: t.inventoryItem?.name || 'Item',
        fromLocationId: t.warehouseId,
        fromLocationName: t.warehouse?.name || 'Source Warehouse',
        toLocationId: 'dest-loc',
        toLocationName: 'Destination Warehouse',
        quantity: Math.abs(t.quantity),
        date: new Date(t.createdAt).toLocaleDateString(),
        transferredBy: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'System User',
      }));
    } catch {
      return [];
    }
  },

  async createTransfer(payload: CreateTransferPayload): Promise<TransferRecord> {
    const res = await apiClient.post<{ status: string; data: BackendTransfer }>(
      '/stock-transfers',
      {
        inventoryItemId: payload.itemId,
        sourceWarehouseId: payload.fromLocationId,
        destinationWarehouseId: payload.toLocationId,
        quantity: payload.quantity,
      }
    );

    const t = res.data.data;
    return {
      id: t.id,
      itemId: t.inventoryItemId,
      itemName: t.inventoryItem?.name || 'Item',
      fromLocationId: payload.fromLocationId,
      fromLocationName: 'Source Warehouse',
      toLocationId: payload.toLocationId,
      toLocationName: 'Destination Warehouse',
      quantity: payload.quantity,
      date: new Date().toLocaleDateString(),
      transferredBy: 'Current User',
    };
  },
};
