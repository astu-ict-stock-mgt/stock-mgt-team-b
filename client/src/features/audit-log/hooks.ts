import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from './api';

export function useAuditLogs(
  filters: { user?: string; action?: string; date?: string },
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: ['audit-logs', filters, page, pageSize],
    queryFn: () => fetchAuditLogs(filters, page, pageSize),
  });
}
