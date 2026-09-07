/**
 * StockReceivingPage.tsx
 * 5-stage workflow page:
 *  Tab 1: GRN Ledger (all roles)
 *  Tab 2: New Delivery / Draft GRN (Storekeeper, Stock Clerk)
 *  Tab 3: Inspection Queue (Stock Clerk / Inspector)
 *  Tab 4: Routing Review (Storekeeper)
 *  Tab 5: PAO Approval (PAO, Administrator)
 */
import React, { useState } from 'react';
import {
  PackageCheck,
  PlusCircle,
  History,
  Microscope,
  ClipboardCheck,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks';
import GrnList from '../components/GrnList';
import CreateGrnForm from '../components/CreateGrnForm';
import InspectionQueue from '../components/InspectionQueue';
import StorekeeperReview from '../components/StorekeeperReview';
import PaoApprovalQueue from '../components/PaoApprovalQueue';

type Tab = 'list' | 'create' | 'inspect' | 'review' | 'pao-approval';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string;
  color: string;
  activeColor: string;
}

export const StockReceivingPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role ?? '';

  const tabs: TabDef[] = [
    {
      id: 'list',
      label: 'GRN Ledger',
      icon: <History className="h-4 w-4" />,
      roles: ['STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR', 'ACCOUNTANT', 'SECURITY_OFFICER', 'DEPARTMENT_HEAD'],
      color: 'bg-white/10 text-white hover:bg-white/20',
      activeColor: 'bg-white text-blue-900 shadow-md',
    },
    {
      id: 'create',
      label: 'New Delivery',
      icon: <PlusCircle className="h-4 w-4" />,
      roles: ['STOREKEEPER', 'STOCK_CLERK', 'PAO', 'ADMINISTRATOR'],
      color: 'bg-white/10 text-white hover:bg-white/20',
      activeColor: 'bg-blue-600 text-white shadow-md',
    },
    {
      id: 'inspect',
      label: 'Inspection Queue',
      icon: <Microscope className="h-4 w-4" />,
      roles: ['STOCK_CLERK', 'STOREKEEPER', 'ADMINISTRATOR'],
      color: 'bg-white/10 text-white hover:bg-white/20',
      activeColor: 'bg-yellow-500 text-white shadow-md',
    },
    {
      id: 'review',
      label: 'Routing Review',
      icon: <ClipboardCheck className="h-4 w-4" />,
      roles: ['STOREKEEPER', 'ADMINISTRATOR'],
      color: 'bg-white/10 text-white hover:bg-white/20',
      activeColor: 'bg-indigo-600 text-white shadow-md',
    },
    {
      id: 'pao-approval',
      label: 'PAO Approval',
      icon: <ShieldCheck className="h-4 w-4" />,
      roles: ['PAO', 'ADMINISTRATOR'],
      color: 'bg-white/10 text-white hover:bg-white/20',
      activeColor: 'bg-purple-600 text-white shadow-md',
    },
  ];

  const visibleTabs = tabs.filter((t) => t.roles.includes(userRole));
  const defaultTab = visibleTabs[0]?.id ?? 'list';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Stage labels shown in the header subtitle based on active tab
  const stageInfo: Record<Tab, { title: string; subtitle: string }> = {
    list:         { title: 'Goods Receiving Notes (GRN)', subtitle: 'Full ledger of all deliveries and their current workflow status.' },
    create:       { title: 'New Delivery Draft', subtitle: 'Register a new incoming shipment from a supplier — Stage 1 of 5.' },
    inspect:      { title: 'Technical Inspection Queue', subtitle: 'Check item quality and record accepted / damaged quantities — Stage 3 of 5.' },
    review:       { title: 'Routing Confirmation', subtitle: 'Review inspection report and confirm good→store, damaged→Damaged Store — Stage 4 of 5.' },
    'pao-approval': { title: 'PAO Final Approval', subtitle: 'Approve to commit stock to inventory, or reject with reason — Stage 5 of 5.' },
  };

  const current = stageInfo[activeTab];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-md">
              <PackageCheck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{current.title}</h1>
              <p className="mt-0.5 text-sm text-blue-200">{current.subtitle}</p>
            </div>
          </div>

          {/* Workflow stage pills */}
          <div className="flex flex-wrap gap-1.5">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    active ? tab.activeColor : tab.color
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workflow pipeline bar */}
        <div className="mt-4 hidden sm:flex items-center gap-1 text-xs text-blue-300/70">
          {[
            { step: '1', label: 'Storekeeper drafts', tab: 'create' },
            { step: '2', label: 'Send to Inspection', tab: 'review' },
            { step: '3', label: 'Inspector records', tab: 'inspect' },
            { step: '4', label: 'Storekeeper routes', tab: 'review' },
            { step: '5', label: 'PAO approves', tab: 'pao-approval' },
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <div
                className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors ${
                  activeTab === s.tab ? 'bg-white/20 text-white' : ''
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-800/60 text-[10px] font-bold">
                  {s.step}
                </span>
                {s.label}
              </div>
              {idx < 4 && <span className="text-blue-800">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'list' && (
          <GrnList onCreateClick={() => setActiveTab('create')} />
        )}

        {activeTab === 'create' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  New Delivery Draft (Stage 1 of 5)
                </h2>
                <p className="text-xs text-gray-500">
                  Record supplier, items received, quantities and unit prices. No inspection yet —
                  the inspector will handle that in Stage 3.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('list')}
                className="text-xs font-semibold text-gray-500 underline hover:text-gray-700"
              >
                Back to Ledger
              </button>
            </div>
            <CreateGrnForm />
          </div>
        )}

        {activeTab === 'inspect' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <InspectionQueue />
          </div>
        )}

        {activeTab === 'review' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <StorekeeperReview />
          </div>
        )}

        {activeTab === 'pao-approval' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <PaoApprovalQueue />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockReceivingPage;
