import apiClient from '../../apiClient';
import type {
  StockTakeSession,
  StockTakeCount,
  Reconciliation,
  InventoryItem,
} from './types';

// ===== Stock Take Session =====

export async function createStockTake(warehouseId: string): Promise<StockTakeSession> {
  const response = await apiClient.post('/stock-taking', { warehouseId });
  return response.data.data;
}

export async function fetchStockTake(sessionId: string): Promise<StockTakeSession> {
  const response = await apiClient.get(`/stock-taking/${sessionId}`);
  return response.data.data;
}

export async function submitCount(
  sessionId: string,
  inventoryItemId: string,
  physicalQuantity: number
): Promise<StockTakeCount> {
  const response = await apiClient.post(`/stock-taking/${sessionId}/counts`, {
    inventoryItemId,
    physicalQuantity,
  });
  return response.data.data;
}

export async function completeStockTake(sessionId: string): Promise<StockTakeSession> {
  const response = await apiClient.post(`/stock-taking/${sessionId}/complete`);
  return response.data.data;
}

// ===== Reconciliations =====

export async function fetchReconciliations(sessionId: string): Promise<Reconciliation[]> {
  const response = await apiClient.get(`/stock-taking/${sessionId}/reconciliations`);
  return response.data.data;
}

export async function approveReconciliation(
  reconciliationId: string,
  reason: string,
  unitCost?: number
): Promise<{ reconciliation: Reconciliation; transaction: any; binCard: any }> {
  const response = await apiClient.post(`/stock-taking/reconciliations/${reconciliationId}/approve`, {
    reason,
    unitCost,
  });
  return response.data.data;
}

export async function rejectReconciliation(
  reconciliationId: string,
  reason: string
): Promise<Reconciliation> {
  const response = await apiClient.post(`/stock-taking/reconciliations/${reconciliationId}/reject`, {
    reason,
  });
  return response.data.data;
}

// ===== Inventory items for counting (using stock-monitoring endpoint) =====

export async function fetchInventoryItemsForWarehouse(warehouseId: string): Promise<InventoryItem[]> {
  // Fallback: if warehouseId not provided, fetch all
  const response = await apiClient.get('/stock-monitoring', {
    params: warehouseId ? { warehouseId } : {},
  });
  const data = response.data.data;
  // Combine critical, warning, healthy into one array
  return [...data.critical, ...data.warning, ...data.healthy];
}