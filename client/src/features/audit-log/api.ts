import type { AuditLog, BackendAuditLog, PaginatedAuditLogs } from './types';
import apiClient from '../../api/apiClient';

export async function fetchAuditLogs(
  filters: { user?: string; action?: string; date?: string } = {},
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedAuditLogs> {
  const response = await apiClient.get<{ status: string; data: BackendAuditLog[] }>('/audit-log');

  let result: AuditLog[] = response.data.data.map((log) => {
    // Attempt to extract description from details or fallback
    let description = 'N/A';
    if (log.details && typeof log.details === 'object') {
      if ('description' in log.details && typeof log.details.description === 'string') {
        description = log.details.description;
      } else {
        description = JSON.stringify(log.details);
      }
    }

    return {
      id: log.id,
      userId: log.userId,
      userName: log.user
        ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() ||
          log.user.email ||
          'Unknown User'
        : 'Unknown User',
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      description,
      ipAddress: 'localhost', // N/A on backend currently
      details: log.details,
      createdAt: log.createdAt,
    };
  });

  const distinctUsers = Array.from(new Set(result.map((log) => log.userName))).filter(Boolean);
  const distinctActions = Array.from(new Set(result.map((log) => log.action))).filter(Boolean);

  if (filters.user && filters.user !== 'All Users') {
    result = result.filter((log) => log.userName === filters.user);
  }

  if (filters.action && filters.action !== 'All') {
    result = result.filter((log) => log.action === filters.action);
  }

  if (filters.date) {
    result = result.filter((log) => log.createdAt.startsWith(filters.date as string));
  }

  // Ensure sorting by createdAt descending (backend already sorts, but just in case after filtering)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalCount = result.length;
  const start = (page - 1) * pageSize;
  const paginatedData = result.slice(start, start + pageSize);

  return { data: paginatedData, totalCount, distinctUsers, distinctActions };
}
