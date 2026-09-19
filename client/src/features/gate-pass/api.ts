import apiClient from '../../api/apiClient';
import type {
  PendingOutboundDispatch,
  PendingInboundDelivery,
  GatePassRecord,
  ClearOutboundPayload,
  ClearInboundPayload,
  FlagDiscrepancyPayload,
  VerificationResult,
} from './types';

export const fetchPendingOutbound = async (): Promise<PendingOutboundDispatch[]> => {
  const response = await apiClient.get<PendingOutboundDispatch[]>('/gate-pass/pending-outbound');
  return response.data;
};

export const fetchPendingInbound = async (): Promise<PendingInboundDelivery[]> => {
  const response = await apiClient.get<PendingInboundDelivery[]>('/gate-pass/pending-inbound');
  return response.data;
};

export const clearOutboundDispatch = async (
  payload: ClearOutboundPayload
): Promise<GatePassRecord> => {
  const response = await apiClient.post<GatePassRecord>('/gate-pass/clear-outbound', payload);
  return response.data;
};

export const clearInboundDelivery = async (
  payload: ClearInboundPayload
): Promise<GatePassRecord> => {
  const response = await apiClient.post<GatePassRecord>('/gate-pass/clear-inbound', payload);
  return response.data;
};

export const flagGateDiscrepancy = async (
  payload: FlagDiscrepancyPayload
): Promise<GatePassRecord> => {
  const response = await apiClient.post<GatePassRecord>('/gate-pass/flag', payload);
  return response.data;
};

export const fetchGatePassHistory = async (params?: {
  direction?: 'OUTBOUND' | 'INBOUND';
  status?: 'CLEARED' | 'FLAGGED';
  query?: string;
}): Promise<GatePassRecord[]> => {
  const response = await apiClient.get<GatePassRecord[]>('/gate-pass/history', { params });
  return response.data;
};

export const verifyGateReference = async (reference: string): Promise<VerificationResult> => {
  const response = await apiClient.get<VerificationResult>(
    `/gate-pass/verify/${encodeURIComponent(reference)}`
  );
  return response.data;
};
