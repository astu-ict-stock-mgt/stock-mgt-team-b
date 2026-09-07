import apiClient from '../../api/apiClient';
import type { InventoryItem, CreateStockTakeDto, StockTakeStatus } from './types';

interface BackendItem {
  id: string;
  itemCode: string;
  name: string;
  category?: { name: string } | string;
}

export async function fetchStockTakeItems(
  _statusFilter?: StockTakeStatus,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: InventoryItem[]; totalCount: number }> {
  try {
    const res = await apiClient.get<{ status: string; data: BackendItem[] }>('/inventory/items');
    const items = res.data?.data || [];

    const mapped: InventoryItem[] = items.map((item) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      systemQuantity: 0,
      actualQuantity: null,
      unitPrice: 0,
      category: typeof item.category === 'object' ? item.category.name : item.category || 'General',
    }));

    const totalCount = mapped.length;
    const start = (page - 1) * pageSize;
    const paginatedData = mapped.slice(start, start + pageSize);

    return { data: paginatedData, totalCount };
  } catch {
    return { data: [], totalCount: 0 };
  }
}

export async function submitStockTake(data: CreateStockTakeDto): Promise<void> {
  await apiClient.post('/stock-taking', {
    inventoryItemId: data.itemId,
    physicalQuantity: data.actualQuantity,
    reason: data.reason,
  });
}

export async function processStockTake(
  id: string,
  action: 'approve' | 'reject',
  notes?: string
): Promise<void> {
  if (action === 'approve') {
    await apiClient.post(`/stock-taking/reconciliations/${id}/approve`, { notes });
  } else {
    await apiClient.post(`/stock-taking/reconciliations/${id}/reject`, { notes });
  }
}
