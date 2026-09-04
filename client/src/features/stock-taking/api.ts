import apiClient from '../../api/apiClient';
import type { InventoryItem, CreateStockTakeDto, StockTakeStatus } from './types';

// Fallback inventory data if inventory endpoint is empty
const mockInventoryItems: InventoryItem[] = [
  {
    id: 'INV-1001',
    itemCode: 'ITM-001',
    itemName: 'A4 Paper Reams (Box of 5)',
    systemQuantity: 120,
    actualQuantity: null,
    unitPrice: 12.5,
    category: 'Office Supplies',
  },
  {
    id: 'INV-1002',
    itemCode: 'ITM-002',
    itemName: 'Office Chairs (Ergonomic)',
    systemQuantity: 15,
    actualQuantity: null,
    unitPrice: 350.0,
    category: 'Furniture',
  },
  {
    id: 'INV-1003',
    itemCode: 'ITM-003',
    itemName: 'Black Ballpoint Pens (Box of 50)',
    systemQuantity: 200,
    actualQuantity: null,
    unitPrice: 2.0,
    category: 'Office Supplies',
  },
  {
    id: 'INV-1004',
    itemCode: 'ITM-004',
    itemName: 'Desktop Computers',
    systemQuantity: 8,
    actualQuantity: null,
    unitPrice: 1500.0,
    category: 'IT Equipment',
  },
  {
    id: 'INV-1005',
    itemCode: 'ITM-005',
    itemName: 'Fire Extinguishers',
    systemQuantity: 4,
    actualQuantity: null,
    unitPrice: 75.0,
    category: 'Safety Equipment',
  },
];

export async function fetchStockTakeItems(
  statusFilter?: StockTakeStatus,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: InventoryItem[]; totalCount: number }> {
  let result = mockInventoryItems;

  try {
    const res = await apiClient.get('/inventory');
    const items = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    if (items.length > 0) {
      result = items.map(
        (i: {
          id: string;
          itemCode?: string;
          sku?: string;
          name: string;
          quantity?: number;
          totalQuantity?: number;
          totalValue?: number;
          category?: string;
        }) => ({
          id: i.id,
          itemCode: i.itemCode ?? i.sku ?? '',
          itemName: i.name,
          systemQuantity: i.quantity ?? i.totalQuantity ?? 0,
          actualQuantity: null,
          unitPrice: (i.quantity ?? 0) > 0 ? (i.totalValue ?? 0) / (i.quantity ?? 1) : 10,
          category: i.category ?? 'General',
        })
      );
    }
  } catch {
    result = mockInventoryItems;
  }

  const storedOverlay = localStorage.getItem('stock_take_overlay');
  if (storedOverlay) {
    try {
      const overlay = JSON.parse(storedOverlay);
      result = result.map((item) => (overlay[item.id] ? { ...item, ...overlay[item.id] } : item));
    } catch {
      result = mockInventoryItems;
    }
  }

  if (statusFilter) {
    if (statusFilter === 'pending') {
      result = result.filter(
        (item) =>
          item.actualQuantity !== null && item.submittedReason && !item.approved && !item.rejected
      );
    } else if (statusFilter === 'approved') {
      result = result.filter((item) => item.approved);
    } else if (statusFilter === 'rejected') {
      result = result.filter((item) => item.rejected);
    } else {
      result = result.filter((item) => item.actualQuantity === null);
    }
  }

  const totalCount = result.length;
  const start = (page - 1) * pageSize;
  const paginatedData = result.slice(start, start + pageSize);

  return { data: paginatedData, totalCount };
}

export async function submitStockTake(data: CreateStockTakeDto): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  let overlay: Record<string, Record<string, unknown>> = {};
  try {
    const stored = localStorage.getItem('stock_take_overlay');
    if (stored) overlay = JSON.parse(stored);
  } catch {
    overlay = {};
  }

  overlay[data.itemId] = {
    actualQuantity: data.actualQuantity,
    discrepancy: data.actualQuantity,
    submittedReason: data.reason,
    submittedAt: new Date().toISOString(),
    submittedBy: 'Storekeeper',
    approved: false,
    rejected: false,
  };

  localStorage.setItem('stock_take_overlay', JSON.stringify(overlay));
}

export async function processStockTake(
  id: string,
  action: 'approve' | 'reject',
  notes?: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  let overlay: Record<string, Record<string, unknown>> = {};
  try {
    const stored = localStorage.getItem('stock_take_overlay');
    if (stored) overlay = JSON.parse(stored);
  } catch {
    overlay = {};
  }

  const current = overlay[id] || {};
  if (action === 'approve') {
    overlay[id] = {
      ...current,
      approved: true,
      approvedAt: new Date().toISOString(),
      approverNotes: notes,
    };
  } else {
    overlay[id] = {
      ...current,
      rejected: true,
      rejectedAt: new Date().toISOString(),
      rejectionNotes: notes,
    };
  }

  localStorage.setItem('stock_take_overlay', JSON.stringify(overlay));
}
