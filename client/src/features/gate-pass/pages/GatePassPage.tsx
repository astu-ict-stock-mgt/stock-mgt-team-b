import React, { useState } from 'react';
import { OutboundExitQueue } from '../components/OutboundExitQueue';
import { InboundEntryQueue } from '../components/InboundEntryQueue';
import { GateVerificationScanner } from '../components/GateVerificationScanner';
import { ClearanceHistory } from '../components/ClearanceHistory';
import { usePendingOutbound, usePendingInbound, useGatePassHistory } from '../hooks';
import { useAuth } from '../../auth/hooks';
import {
  ShieldCheck,
  Truck,
  PackageCheck,
  History,
  QrCode,
  Shield,
  Clock,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound' | 'scanner' | 'history'>(
    'outbound'
  );

  const { data: outbound } = usePendingOutbound();
  const { data: inbound } = usePendingInbound();
  const { data: history } = useGatePassHistory();

  const pendingOutboundCount = outbound?.filter((o) => o.status === 'READY_FOR_EXIT').length || 0;
  const pendingInboundCount = inbound?.filter((i) => i.status === 'READY_FOR_ENTRY').length || 0;
  const clearedCount = history?.filter((h) => h.status === 'CLEARED').length || 0;
  const flaggedCount = history?.filter((h) => h.status === 'FLAGGED').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-rose-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Gate Pass Verification & Exit Clearance
            </h1>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
              Security Officer
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Control physical asset movement across organization premises, inspect incoming supplier
            deliveries, and issue official MoFED-compliant Gate Passes for departing goods.
          </p>
        </div>

        {/* User Role Profile Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : 'Security Officer'}
            </p>
            <p className="text-[11px] text-gray-500">
              Gate Post #1 • {user?.role || 'SECURITY_OFFICER'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Pending Departures</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{pendingOutboundCount}</span>
            <span className="text-[11px] font-semibold text-amber-600">Awaiting Exit</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Inbound Deliveries</span>
            <PackageCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{pendingInboundCount}</span>
            <span className="text-[11px] font-semibold text-blue-600">Incoming Supplier</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Cleared Passes</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{clearedCount}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Authorized Moves</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Flagged / Held</span>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{flaggedCount}</span>
            <span className="text-[11px] font-semibold text-red-600">Discrepancies</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto rounded-t-2xl border-b border-gray-200 bg-white px-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('outbound')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === 'outbound'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Truck className="h-4 w-4" />
          Outbound Exit Clearances ({pendingOutboundCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inbound')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === 'inbound'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          Inbound Supplier Inspections ({pendingInboundCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === 'scanner'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <QrCode className="h-4 w-4" />
          Quick Gate Scanner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <History className="h-4 w-4" />
          Clearance Log & History
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'outbound' && <OutboundExitQueue />}
        {activeTab === 'inbound' && <InboundEntryQueue />}
        {activeTab === 'scanner' && <GateVerificationScanner />}
        {activeTab === 'history' && <ClearanceHistory />}
      </div>
    </div>
  );
};
