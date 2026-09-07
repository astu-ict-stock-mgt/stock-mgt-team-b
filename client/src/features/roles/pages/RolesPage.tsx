import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Info, Lock } from 'lucide-react';
import { Role } from '../../users/types';

interface RoleInfo {
  role: Role;
  title: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  summary: string;
  responsibilities: string[];
}

const ROLES_DATA: RoleInfo[] = [
  {
    role: 'ADMINISTRATOR',
    title: 'Administrator',
    badgeColor: 'text-purple-700',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    summary:
      'Master administrator responsible for user account provisioning, system parameters, security policies, and technical integrity.',
    responsibilities: [
      'Create, modify, and deactivate system user accounts and assign security roles',
      'Manage system settings, global parameters, valuation policies, and preferences',
      'Inspect complete system audit logs and trace all user actions and timestamps',
      'Full administrative override and read access across all inventory operations',
    ],
  },
  {
    role: 'PAO',
    title: 'Property Administration Officer (PAO)',
    badgeColor: 'text-blue-700',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    summary:
      'Executive authority supervising the entire organization inventory lifecycle, physical assets, and critical approvals.',
    responsibilities: [
      'Approve or reject Store Issue Requisitions (SIV) and Departmental requests',
      'Review and authorize inter-warehouse and inter-department stock transfers',
      'Evaluate and approve Damaged & Obsolete stock write-offs and disposal orders',
      'Authorize physical inventory stock-taking reconciliations and discrepancy adjustments',
      'Access organizational inventory valuation, FIFO reports, and audit trails',
    ],
  },
  {
    role: 'STOREKEEPER',
    title: 'Storekeeper',
    badgeColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    summary:
      'Primary custodian of physical warehouse inventory, receipts, storage allocation, bin cards, and stock dispatches.',
    responsibilities: [
      'Inspect inbound deliveries and generate Goods Receiving Notes (GRN)',
      'Fulfill approved Store Issue Vouchers (SIV) and issue items via FIFO methodology',
      'Maintain real-time physical bin cards and stock location cards',
      'Conduct routine physical stock counting and submit count variance sheets',
      'Identify damaged, defective, or expired items and draft write-off requests',
    ],
  },
  {
    role: 'STOCK_CLERK',
    title: 'Stock Clerk',
    badgeColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    summary:
      'Administrative and recording personnel supporting storekeeping documentation and transaction data entry.',
    responsibilities: [
      'Assist with data entry for stock receiving and issuance transactions',
      'Draft and review stock requisition forms on behalf of authorized departments',
      'Participate in physical stock verification counts and records alignment',
      'Query inventory balances, catalog codes, and reorder levels',
    ],
  },
  {
    role: 'ACCOUNTANT',
    title: 'Accountant',
    badgeColor: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    summary:
      'Financial officer overseeing inventory asset valuation, FIFO cost layers, general ledger consistency, and financial statements.',
    responsibilities: [
      'Generate and verify FIFO Inventory Valuation and cost consumption reports',
      'Audit stock transaction ledgers, receiving unit costs, and issued batch costs',
      'Review financial impact of stock reconciliation adjustments and write-offs',
      'Inspect historical audit logs for compliance with financial standards',
    ],
  },
  {
    role: 'DEPARTMENT_HEAD',
    title: 'Department Head',
    badgeColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    summary:
      'Departmental authority requesting operational materials and approving internal team requisitions.',
    responsibilities: [
      'Submit and certify departmental material requisition requests',
      'Approve internal staff store requests prior to PAO/Storekeeper fulfillment',
      'Monitor departmental stock usage trends and material consumption history',
      'View general catalog items and availability status',
    ],
  },
  {
    role: 'SECURITY_OFFICER',
    title: 'Security Officer',
    badgeColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    summary:
      'Gate and dispatch security officer verifying physical movement of organization assets against valid documentation.',
    responsibilities: [
      'Verify outgoing material dispatches against approved Store Issue Vouchers and Gate Passes',
      'Inspect incoming supplier deliveries before warehouse receiving processing',
      'Record gate entry and exit verification logs for physical audit tracking',
      'Validate transfer notes for materials traveling between organizational sites',
    ],
  },
];

interface ModulePermission {
  module: string;
  admin: boolean;
  pao: boolean;
  storekeeper: boolean;
  clerk: boolean;
  accountant: boolean;
  deptHead: boolean;
  security: boolean;
}

const MATRIX_DATA: ModulePermission[] = [
  {
    module: 'User Management & Access Control',
    admin: true,
    pao: true,
    storekeeper: false,
    clerk: false,
    accountant: false,
    deptHead: false,
    security: false,
  },
  {
    module: 'Inventory Catalog & Item Codes',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: true,
    deptHead: true,
    security: true,
  },
  {
    module: 'Stock Receiving & GRN Generation',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: false,
    deptHead: false,
    security: false,
  },
  {
    module: 'Stock Requisition & Issuing (SIV)',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: true,
    deptHead: true,
    security: true,
  },
  {
    module: 'Inter-Store Transfers & Relocation',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: false,
    deptHead: false,
    security: false,
  },
  {
    module: 'Physical Stock Taking & Count',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: true,
    deptHead: false,
    security: false,
  },
  {
    module: 'Stock Reconciliation Approval',
    admin: true,
    pao: true,
    storekeeper: false,
    clerk: false,
    accountant: false,
    deptHead: false,
    security: false,
  },
  {
    module: 'Damaged / Obsolete Disposal',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: true,
    deptHead: false,
    security: false,
  },
  {
    module: 'FIFO Inventory Valuation Reports',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: false,
    accountant: true,
    deptHead: false,
    security: false,
  },
  {
    module: 'Supplier Directory & Management',
    admin: true,
    pao: true,
    storekeeper: true,
    clerk: true,
    accountant: true,
    deptHead: false,
    security: false,
  },
  {
    module: 'System Audit Logs & Security Trails',
    admin: true,
    pao: true,
    storekeeper: false,
    clerk: false,
    accountant: true,
    deptHead: false,
    security: false,
  },
  {
    module: 'System Preferences & Settings',
    admin: true,
    pao: false,
    storekeeper: false,
    clerk: false,
    accountant: false,
    deptHead: false,
    security: false,
  },
];

export const RolesPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('ADMINISTRATOR');

  const currentRoleInfo = ROLES_DATA.find((r) => r.role === selectedRole) || ROLES_DATA[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-md">
            <Shield className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Role-Based Access Control (RBAC)</h1>
            <p className="mt-1 text-sm text-blue-200">
              Authority matrix, operational boundaries, and system permissions according to SRS
              Chapter 2 & 3.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ROLES_DATA.map((r) => {
          const isSelected = selectedRole === r.role;
          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${r.badgeBg} ${r.badgeColor} ${r.badgeBorder}`}
              >
                {r.role}
              </span>
              <p className="mt-2 w-full truncate text-xs font-semibold text-gray-900">{r.title}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Role Deep Dive */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${currentRoleInfo.badgeBg} ${currentRoleInfo.badgeBorder}`}
            >
              <Lock className={`h-5 w-5 ${currentRoleInfo.badgeColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentRoleInfo.title}</h2>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${currentRoleInfo.badgeBg} ${currentRoleInfo.badgeColor}`}
              >
                Code: {currentRoleInfo.role}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
          <Info className="mr-1.5 inline-block h-4 w-4 text-blue-600" />
          {currentRoleInfo.summary}
        </p>

        <div className="mt-5">
          <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Key Responsibilities & Operational Scope
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {currentRoleInfo.responsibilities.map((resp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-white p-3 text-xs text-gray-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global RBAC Permission Matrix Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Permission Matrix</h2>
            <p className="text-xs text-gray-500">
              Cross-functional module permissions per organizational role.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Authorized
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-gray-300" /> Restricted
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3.5">System Module</th>
                <th className="px-3 py-3.5 text-center">Admin</th>
                <th className="px-3 py-3.5 text-center">PAO</th>
                <th className="px-3 py-3.5 text-center">Storekeeper</th>
                <th className="px-3 py-3.5 text-center">Stock Clerk</th>
                <th className="px-3 py-3.5 text-center">Accountant</th>
                <th className="px-3 py-3.5 text-center">Dept Head</th>
                <th className="px-3 py-3.5 text-center">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MATRIX_DATA.map((row, idx) => (
                <tr key={idx} className="transition-colors hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.module}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.admin)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.pao)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.storekeeper)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.clerk)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.accountant)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.deptHead)}</td>
                  <td className="px-3 py-3 text-center">{renderIcon(row.security)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function renderIcon(allowed: boolean) {
  if (allowed) {
    return <CheckCircle2 className="inline-block h-4 w-4 text-emerald-600" />;
  }
  return <XCircle className="inline-block h-4 w-4 text-gray-300" />;
}

export default RolesPage;
