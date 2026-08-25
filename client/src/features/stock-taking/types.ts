// client/src/features/stock-taking/types.ts

export type StockTakeStatus = 'pending' | 'approved' | 'rejected';

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  systemQuantity: number;
  actualQuantity: number | null;
  unitPrice: number;
  category: string;
  discrepancy?: number;
  submittedReason?: string;
  submittedAt?: string;
  submittedBy?: string;
  approved?: boolean;
  approvedAt?: string;
  approverNotes?: string;
  rejected?: boolean;
  rejectedAt?: string;
  rejectionNotes?: string;
}

export interface CreateStockTakeDto {
  itemId: string;
  actualQuantity: number;
  reason: string;
}
