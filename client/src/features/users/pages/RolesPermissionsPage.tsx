import { useState } from 'react';
import { Shield, ShieldCheck, UserCheck, Check, Minus, Users, Search } from 'lucide-react';
import { useGetUsers } from '../hooks';
import type { Role } from '../types';

interface RoleDefinition {
  key: Role;
  title: string;
  badge: string;
  color: string;
  badgeBg: string;
  description: string;
  responsibilities: string[];
}

const ROLES_DATA: RoleDefinition[] = [
  {
    key: 'ADMINISTRATOR',
    title: 'Administrator',
    badge: 'Superuser',
    color: 'border-purple-200 bg-purple-50 text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800',
    description:
      'Full administrative authority across all modules, user accounts, and system policies.',
    responsibilities: [
      'Create, modify, and deactivate user accounts',
      'Oversee system configuration and operational policies',
      'Inspect immutable system-wide audit logs',
      'Approve final asset write-offs and disposals',
    ],
  },
  {
    key: 'PAO',
    title: 'Property Admin Officer (PAO)',
    badge: 'Supervisory',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800',
    description:
      'Supervises all institutional inventory operations, approvals, and physical stock reconciliations.',
    responsibilities: [
      'Authorize inter-warehouse stock transfers',
      'Review and approve physical stock take reconciliations',
      'Authorize material write-off requests with technical committee',
      'Monitor organization-wide stock availability and valuation',
    ],
  },
  {
    key: 'STOREKEEPER',
    title: 'Storekeeper',
    badge: 'Custodial',
    color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    description:
      'Responsible for physical custody, receipt, inspection, issuing, and bin card records.',
    responsibilities: [
      'Receive supplier deliveries and conduct inspections (GRN)',
      'Issue stock against approved requisitions (SIV)',
      'Maintain running balances on physical bin cards',
      'Record damaged, expired, or obsolete items in warehouse',
    ],
  },
  {
    key: 'STOCK_CLERK',
    title: 'Stock Clerk',
    badge: 'Operational',
    color: 'border-amber-200 bg-amber-50 text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800',
    description:
      'Maintains stock transactions, tracks inventory thresholds, and produces operational ledgers.',
    responsibilities: [
      'Update stock records for all receipts and issues',
      'Monitor minimum, reorder, and safety stock levels',
      'Prepare periodic stock movement summaries',
      'Record physical counts during stock taking exercises',
    ],
  },
  {
    key: 'DEPARTMENT_HEAD',
    title: 'Department Head',
    badge: 'Departmental',
    color: 'border-teal-200 bg-teal-50 text-teal-700',
    badgeBg: 'bg-teal-100 text-teal-800',
    description:
      'Manages departmental resource allocation, requisitions, and material utilization.',
    responsibilities: [
      'Initiate and review departmental material requisitions',
      'Approve or reject requests from department staff',
      'Track materials issued to departmental custody',
      'Validate justification for material consumption',
    ],
  },
  {
    key: 'ACCOUNTANT',
    title: 'Accountant',
    badge: 'Financial',
    color: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    description:
      'Manages financial valuation of inventory using First-In-First-Out (FIFO) standards.',
    responsibilities: [
      'Analyze FIFO inventory valuation reports and cost layers',
      'Review financial impact of inventory consumption and write-downs',
      'Inspect procurement purchase costs and receiving valuations',
      'Generate fiscal year-end inventory valuation statements',
    ],
  },
  {
    key: 'SECURITY_OFFICER',
    title: 'Security Officer',
    badge: 'Verification',
    color: 'border-rose-200 bg-rose-50 text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-800',
    description:
      'Verifies physical movement of materials entering or leaving the organization premises.',
    responsibilities: [
      'Inspect delivery notes for incoming supplier vehicles',
      'Validate authorized Store Issue Vouchers (SIV) and Gate Passes',
      'Record dispatch and exit timestamps of materials',
      'Prevent unauthorized asset removal from premises',
    ],
  },
];

interface PermissionRow {
  module: string;
  permissions: Record<Role, 'FULL' | 'CREATE_APPROVE' | 'CREATE_VIEW' | 'VIEW' | 'NONE'>;
}

const PERMISSIONS_MATRIX: PermissionRow[] = [
  {
    module: 'User Management',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'VIEW',
      STOREKEEPER: 'NONE',
      STOCK_CLERK: 'NONE',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'NONE',
      SECURITY_OFFICER: 'NONE',
    },
  },
  {
    module: 'Supplier Directory',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'VIEW',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'NONE',
    },
  },
  {
    module: 'Inventory Items & Catalog',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_VIEW',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'VIEW',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'VIEW',
    },
  },
  {
    module: 'Stock Receiving & GRN',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_APPROVE',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'VIEW',
    },
  },
  {
    module: 'Requisitions & Stock Issuing (SIV)',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_APPROVE',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'CREATE_APPROVE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'VIEW',
    },
  },
  {
    module: 'Stock Transfers (Inter-Warehouse)',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_VIEW',
      STOCK_CLERK: 'VIEW',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'VIEW',
    },
  },
  {
    module: 'Stock Taking & Reconciliation',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_VIEW',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'NONE',
    },
  },
  {
    module: 'Damaged & Obsolete Write-Offs',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'CREATE_APPROVE',
      STOREKEEPER: 'CREATE_VIEW',
      STOCK_CLERK: 'CREATE_VIEW',
      DEPARTMENT_HEAD: 'VIEW',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'NONE',
    },
  },
  {
    module: 'FIFO Valuation & Reports',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'FULL',
      STOREKEEPER: 'VIEW',
      STOCK_CLERK: 'VIEW',
      DEPARTMENT_HEAD: 'VIEW',
      ACCOUNTANT: 'FULL',
      SECURITY_OFFICER: 'NONE',
    },
  },
  {
    module: 'Audit Logs',
    permissions: {
      ADMINISTRATOR: 'FULL',
      PAO: 'VIEW',
      STOREKEEPER: 'NONE',
      STOCK_CLERK: 'NONE',
      DEPARTMENT_HEAD: 'NONE',
      ACCOUNTANT: 'VIEW',
      SECURITY_OFFICER: 'NONE',
    },
  },
];

function renderBadge(type: 'FULL' | 'CREATE_APPROVE' | 'CREATE_VIEW' | 'VIEW' | 'NONE') {
  switch (type) {
    case 'FULL':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
          <Check className="h-3 w-3" /> Full
        </span>
      );
    case 'CREATE_APPROVE':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          <Check className="h-3 w-3" /> Approve
        </span>
      );
    case 'CREATE_VIEW':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          <Check className="h-3 w-3" /> Create
        </span>
      );
    case 'VIEW':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          View
        </span>
      );
    case 'NONE':
      return (
        <span className="inline-flex items-center text-gray-300">
          <Minus className="h-3.5 w-3.5" />
        </span>
      );
  }
}

export function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'roles' | 'members'>('matrix');
  const [memberFilter, setMemberFilter] = useState('');
  const { data: usersData, isLoading } = useGetUsers();

  const usersList = usersData?.data ?? [];

  const filteredMembers = usersList.filter((u) => {
    const q = memberFilter.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Roles & Permissions</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Role-Based Access Control (RBAC) definitions and authority matrix compliant with SRS
            Section 4.4.8 and MoFED standards.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'matrix'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Permission Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'roles'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Role Profiles (7)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'members'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Role Assignments
          </button>
        </div>
      </div>

      {/* View 1: Permissions Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900">Module Access Control Matrix</h2>
            <p className="text-xs text-gray-500">
              Cross-functional permission mapping for all 12 operational stock management modules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Module / Feature</th>
                  <th className="px-3 py-3.5 text-center">Administrator</th>
                  <th className="px-3 py-3.5 text-center">PAO</th>
                  <th className="px-3 py-3.5 text-center">Storekeeper</th>
                  <th className="px-3 py-3.5 text-center">Stock Clerk</th>
                  <th className="px-3 py-3.5 text-center">Dept Head</th>
                  <th className="px-3 py-3.5 text-center">Accountant</th>
                  <th className="px-3 py-3.5 text-center">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PERMISSIONS_MATRIX.map((row) => (
                  <tr key={row.module} className="transition hover:bg-gray-50/60">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{row.module}</td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.ADMINISTRATOR)}
                    </td>
                    <td className="px-3 py-3.5 text-center">{renderBadge(row.permissions.PAO)}</td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.STOREKEEPER)}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.STOCK_CLERK)}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.DEPARTMENT_HEAD)}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.ACCOUNTANT)}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {renderBadge(row.permissions.SECURITY_OFFICER)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Legend:</span>
            <span className="flex items-center gap-1">
              {renderBadge('FULL')} System Administration
            </span>
            <span className="flex items-center gap-1">
              {renderBadge('CREATE_APPROVE')} Issue / Authorize
            </span>
            <span className="flex items-center gap-1">
              {renderBadge('CREATE_VIEW')} Record & Register
            </span>
            <span className="flex items-center gap-1">{renderBadge('VIEW')} Read & Audit</span>
            <span className="flex items-center gap-1">{renderBadge('NONE')} Access Restricted</span>
          </div>
        </div>
      )}

      {/* View 2: Role Profiles */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ROLES_DATA.map((role) => {
            const memberCount = usersList.filter((u) => u.role === role.key).length;
            return (
              <div
                key={role.key}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${role.badgeBg}`}
                    >
                      {role.badge}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {memberCount} user{memberCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-gray-900">{role.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{role.description}</p>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Key Mandates
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {role.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                  <span className="font-mono text-[11px] text-gray-400">ID: {role.key}</span>
                  <span className="font-medium text-blue-600">SRS 4.4.8 Enforced</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 3: Active Members */}
      {activeTab === 'members' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Current User Assignments</h2>
              <p className="text-xs text-gray-500">
                Staff accounts with their assigned institutional roles and status.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff or role..."
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-1.5 pr-4 pl-9 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading staff assignments...
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No matching staff members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((u) => {
                    const roleMeta = ROLES_DATA.find((r) => r.key === u.role);
                    return (
                      <tr key={u.id} className="transition hover:bg-gray-50/60">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-gray-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-gray-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                              roleMeta?.badgeBg ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {roleMeta?.title ?? u.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {u.department || 'Central Administration'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPermissionsPage;
