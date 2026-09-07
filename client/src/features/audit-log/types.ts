export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
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
