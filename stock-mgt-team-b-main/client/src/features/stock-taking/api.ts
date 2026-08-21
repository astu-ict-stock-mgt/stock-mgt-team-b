import type { InventoryItem, CreateStockTakeDto, StockTakeStatus } from './types';

// Mocked inventory data (since we don't have a real DB yet)
let mockInventoryItems: InventoryItem[] = [
  { id: 'INV-1001', itemCode: 'ITM-001', itemName: 'A4 Paper Reams (Box of 5)', systemQuantity: 120, actualQuantity: null, unitPrice: 12.50, category: 'Office Supplies' },
  { id: 'INV-1002', itemCode: 'ITM-002', itemName: 'Office Chairs (Ergonomic)', systemQuantity: 15, actualQuantity: null, unitPrice: 350.00, category: 'Furniture' },
  { id: 'INV-1003', itemCode: 'ITM-003', itemName: 'Black Ballpoint Pens (Box of 50)', systemQuantity: 200, actualQuantity: null, unitPrice: 2.00, category: 'Office Supplies' },
  { id: 'INV-1004', itemCode: 'ITM-004', itemName: 'Desktop Computers', systemQuantity: 8, actualQuantity: null, unitPrice: 1500.00, category: 'IT Equipment' },
  { id: 'INV-1005', itemCode: 'ITM-005', itemName: 'Fire Extinguishers', systemQuantity: 4, actualQuantity: null, unitPrice: 75.00, category: 'Safety Equipment' },
];

let mockReconciliations: any[] = [];

export async function fetchStockTakeItems(
  statusFilter?: StockTakeStatus,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: InventoryItem[]; totalCount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let result = mockInventoryItems;
  
  if (statusFilter) {
    if (statusFilter === 'pending') {
      result = result.filter((item) => item.actualQuantity !== null && item.submittedReason && !item.approved && !item.rejected);
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
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Update the actual quantities
  const itemIndex = mockInventoryItems.findIndex((i) => i.id === data.itemId);
  if (itemIndex === -1) throw new Error('Item not found');
  
  const item = mockInventoryItems[itemIndex];
  mockInventoryItems[itemIndex] = {
    ...item,
    actualQuantity: data.actualQuantity,
    discrepancy: item.systemQuantity - data.actualQuantity,
    submittedReason: data.reason,
    submittedAt: new Date().toISOString(),
    submittedBy: 'Storekeeper', // Mocked user
    approved: false,
    rejected: false,
  };
}

export async function processStockTake(id: string, action: 'approve' | 'reject', notes?: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const index = mockInventoryItems.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Item not found');

  if (action === 'approve') {
    mockInventoryItems[index] = { ...mockInventoryItems[index], approved: true, approvedAt: new Date().toISOString(), approverNotes: notes };
  } else {
    mockInventoryItems[index] = { ...mockInventoryItems[index], rejected: true, rejectedAt: new Date().toISOString(), rejectionNotes: notes };
  }
}