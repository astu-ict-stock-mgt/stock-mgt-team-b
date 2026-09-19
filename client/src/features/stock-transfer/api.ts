import apiClient from '../../api/apiClient';

export interface Item {
  id: string;
  name: string;
  itemCode: string;
  category: string;
  totalAvailable?: number;
}

export interface Location {
  id: string;
  name: string;
  location?: string | null;
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
  itemCode?: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  quantity: number;
  date: string;
  transferDate?: string;
  transferredBy: string;
  referenceNumber?: string | null;
  status?: string;
}

export interface CreateTransferPayload {
  itemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  referenceNumber?: string;
  transferredBy?: string;
}

export const stockTransferApi = {
  async getItems(): Promise<Item[]> {
    const res = await apiClient.get<Item[]>('/stock-transfers/items');
    return res.data;
  },

  async getLocations(): Promise<Location[]> {
    const res = await apiClient.get<Location[]>('/stock-transfers/locations');
    return res.data;
  },

  async getItemStockLocations(itemId: string): Promise<ItemStockLocation[]> {
    const res = await apiClient.get<ItemStockLocation[]>(`/stock-transfers/item-stock/${itemId}`);
    return res.data;
  },

  async getTransferHistory(search?: string): Promise<TransferRecord[]> {
    const res = await apiClient.get<TransferRecord[]>('/stock-transfers');
    let transfers = res.data;
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      transfers = transfers.filter(
        (t) =>
          t.itemName.toLowerCase().includes(q) ||
          t.fromLocationName.toLowerCase().includes(q) ||
          t.toLocationName.toLowerCase().includes(q) ||
          t.transferredBy.toLowerCase().includes(q) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
          t.date.toLowerCase().includes(q)
      );
    }
    return transfers;
  },

  async createTransfer(payload: CreateTransferPayload): Promise<TransferRecord> {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: {
        transaction: {
          id: string;
          quantity: number;
          referenceNumber?: string | null;
        };
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        sourceBalance: number;
        destinationBalance: number;
      };
    }>('/stock-transfers', {
      itemId: payload.itemId,
      fromWarehouseId: payload.fromLocationId,
      toWarehouseId: payload.toLocationId,
      quantity: payload.quantity,
      referenceNumber: payload.referenceNumber,
    });

    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return {
      id: res.data.data?.transaction?.id || `tr-${Date.now()}`,
      itemId: payload.itemId,
      itemName: 'Transferred Item',
      fromLocationId: payload.fromLocationId,
      fromLocationName: 'Source',
      toLocationId: payload.toLocationId,
      toLocationName: 'Destination',
      quantity: payload.quantity,
      date: formattedDate,
      transferredBy: payload.transferredBy || 'User',
      referenceNumber: payload.referenceNumber,
      status: 'COMPLETED',
    };
  },
};
