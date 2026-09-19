import apiClient from '../../api/apiClient';
import type {
  ApproveReconciliationPayload,
  ReconciliationItem,
  RejectReconciliationPayload,
  SessionWorksheetResponse,
  StockTakeSession,
  SubmitCountPayload,
  WarehouseOption,
} from './types';

export const stockTakingApi = {
  // Fetch available warehouses for stock taking
  getWarehouses: async (): Promise<WarehouseOption[]> => {
    const res = await apiClient.get<WarehouseOption[]>('/warehouses');
    return res.data;
  },

  // List all stock take sessions
  listSessions: async (filters?: {
    warehouseId?: string;
    status?: string;
  }): Promise<StockTakeSession[]> => {
    const params = new URLSearchParams();
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.status) params.append('status', filters.status);

    const res = await apiClient.get<{ status: string; data: StockTakeSession[] }>(
      `/stock-taking?${params.toString()}`
    );
    return res.data.data;
  },

  // Start a new stock take session for a warehouse
  createSession: async (warehouseId: string): Promise<StockTakeSession> => {
    const res = await apiClient.post<{ status: string; data: StockTakeSession }>('/stock-taking', {
      warehouseId,
    });
    return res.data.data;
  },

  // Get active session worksheet with real-time system balances and physical counts
  getSessionWorksheet: async (sessionId: string): Promise<SessionWorksheetResponse> => {
    const res = await apiClient.get<{ status: string; data: SessionWorksheetResponse }>(
      `/stock-taking/${sessionId}/worksheet`
    );
    return res.data.data;
  },

  // Submit physical count for an item in a session
  submitCount: async (payload: SubmitCountPayload): Promise<unknown> => {
    const res = await apiClient.post<{ status: string; data: unknown }>(
      `/stock-taking/${payload.sessionId}/counts`,
      {
        inventoryItemId: payload.inventoryItemId,
        physicalQuantity: payload.physicalQuantity,
      }
    );
    return res.data.data;
  },

  // Complete a stock take session
  completeSession: async (sessionId: string): Promise<StockTakeSession> => {
    const res = await apiClient.post<{ status: string; data: StockTakeSession }>(
      `/stock-taking/${sessionId}/complete`
    );
    return res.data.data;
  },

  // Get all reconciliations (optionally filtered by status: PENDING, APPLIED, REJECTED)
  getReconciliations: async (status?: string): Promise<ReconciliationItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const res = await apiClient.get<{ status: string; data: ReconciliationItem[] }>(
      `/stock-taking/reconciliations?${params.toString()}`
    );
    return res.data.data;
  },

  // Approve a reconciliation adjustment (PAO or Administrator)
  approveReconciliation: async (payload: ApproveReconciliationPayload): Promise<unknown> => {
    const res = await apiClient.post<{ status: string; data: unknown }>(
      `/stock-taking/reconciliations/${payload.reconciliationId}/approve`,
      {
        reason: payload.reason,
        unitCost: payload.unitCost,
      }
    );
    return res.data.data;
  },

  // Reject a reconciliation adjustment (PAO or Administrator)
  rejectReconciliation: async (payload: RejectReconciliationPayload): Promise<unknown> => {
    const res = await apiClient.post<{ status: string; data: unknown }>(
      `/stock-taking/reconciliations/${payload.reconciliationId}/reject`,
      {
        reason: payload.reason,
      }
    );
    return res.data.data;
  },
};

export default stockTakingApi;
