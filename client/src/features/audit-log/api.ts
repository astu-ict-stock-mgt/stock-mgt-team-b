import type { AuditLog, PaginatedAuditLogs } from './types';

// Mock data for audit logs based on the mockup
const mockAuditLogs: AuditLog[] = [
  {
    id: 'AL-1001',
    userId: 'usr-1',
    userName: 'j.storekeeper',
    action: 'CREATED',
    entity: 'Inventory',
    description: 'Cataloged new SKU-9948: Dell Precision Laptop 15"',
    ipAddress: '192.168.1.14',
    createdAt: '2026-10-24T10:42:00Z',
  },
  {
    id: 'AL-1002',
    userId: 'usr-2',
    userName: 'a.clerk',
    action: 'UPDATED',
    entity: 'Inventory',
    description: 'Dispatched 12 units of Mechanical Keyboard Pro',
    ipAddress: '192.168.1.18',
    createdAt: '2026-10-24T09:15:00Z',
  },
  {
    id: 'AL-1003',
    userId: 'usr-3',
    userName: 'm.vance',
    action: 'APPROVED',
    entity: 'Requests',
    description: 'Authorized request REQ-2939',
    ipAddress: '192.168.1.2',
    createdAt: '2026-10-23T16:30:00Z',
  },
  {
    id: 'AL-1004',
    userId: 'sys-0',
    userName: 'system',
    action: 'DELETED',
    entity: 'Users',
    description: 'Purged expired security session for guest clerk',
    ipAddress: 'localhost',
    createdAt: '2026-10-23T11:20:00Z',
  },
  {
    id: 'AL-1005',
    userId: 'usr-3',
    userName: 'm.vance',
    action: 'LOGIN',
    entity: 'Auth',
    description: 'User admin console validation success',
    ipAddress: '192.168.1.2',
    createdAt: '2026-10-22T15:15:00Z',
  },
  {
    id: 'AL-1006',
    userId: 'usr-4',
    userName: 'a.stone',
    action: 'UPDATED',
    entity: 'Suppliers',
    description: 'Re-certified Supplier Portal compliance checks',
    ipAddress: '192.168.1.25',
    createdAt: '2026-10-22T13:10:00Z',
  },
  {
    id: 'AL-1007',
    userId: 'usr-5',
    userName: 'n.bello',
    action: 'CREATED',
    entity: 'Inventory',
    description: 'Registered stock receipt for Core Router Switch',
    ipAddress: '192.168.1.30',
    createdAt: '2026-10-21T09:00:00Z',
  },
  {
    id: 'AL-1008',
    userId: 'usr-6',
    userName: 'p.parker',
    action: 'UPDATED',
    entity: 'Settings',
    description: 'Adjusted warehouse minimum alert specs',
    ipAddress: '192.168.1.41',
    createdAt: '2026-10-20T17:22:00Z',
  },
];

export async function fetchAuditLogs(
  filters: { user?: string; action?: string; date?: string } = {},
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedAuditLogs> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let result = [...mockAuditLogs];

  if (filters.user && filters.user !== 'All Users') {
    result = result.filter((log) => log.userName === filters.user);
  }

  if (filters.action && filters.action !== 'All') {
    result = result.filter((log) => log.action === filters.action);
  }

  if (filters.date) {
    result = result.filter((log) => log.createdAt.startsWith(filters.date as string));
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Normally we would have more than 8 entries to show pagination
  // For demo, we duplicate them to simulate a larger dataset
  const expandedResult = [];
  for (let i = 0; i < 20; i++) {
    expandedResult.push(...result.map((r, index) => ({ ...r, id: `${r.id}-${i}-${index}` })));
  }

  const totalCount = expandedResult.length; // Will be 160 or less depending on filters
  const start = (page - 1) * pageSize;
  const paginatedData = expandedResult.slice(start, start + pageSize);

  return { data: paginatedData, totalCount };
}
