import apiClient from '../../api/apiClient';
import type { AuditLog, PaginatedAuditLogs } from './types';

interface BackendAuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export async function fetchAuditLogs(
  filters: { user?: string; action?: string; date?: string } = {},
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedAuditLogs> {
  try {
    const res = await apiClient.get<{ status: string; data: BackendAuditLog[] }>('/audit-log');
    const logs = res.data?.data || [];

    let mapped: AuditLog[] = logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user ? `${l.user.firstName} ${l.user.lastName}` : l.userId,
      action: l.action,
      entity: l.entity,
      description: l.details ? JSON.stringify(l.details) : `${l.action} on ${l.entity}`,
      ipAddress: 'System',
      createdAt: l.createdAt,
    }));

    if (filters.user && filters.user !== 'All Users') {
      mapped = mapped.filter((log) =>
        log.userName.toLowerCase().includes(filters.user!.toLowerCase())
      );
    }

    if (filters.action && filters.action !== 'All') {
      mapped = mapped.filter((log) => log.action === filters.action);
    }

    if (filters.date) {
      mapped = mapped.filter((log) => log.createdAt.startsWith(filters.date as string));
    }

    const totalCount = mapped.length;
    const start = (page - 1) * pageSize;
    const paginatedData = mapped.slice(start, start + pageSize);

    return { data: paginatedData, totalCount };
  } catch {
    return { data: [], totalCount: 0 };
  }
}
