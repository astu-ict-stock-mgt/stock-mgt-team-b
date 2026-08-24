export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'LOGIN' | 'LOGOUT' | 'APPROVED' | 'REJECTED';
  entity: string;
  entityId?: string | null;
  description?: string;
  ipAddress?: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  totalCount: number;
}
