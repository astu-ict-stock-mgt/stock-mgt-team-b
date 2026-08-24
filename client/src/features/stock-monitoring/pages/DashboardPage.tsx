import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingDown,
  ShieldAlert,
  AlertCircle,
  ArrowUpRight,
  FileSpreadsheet,
  Truck,
  Users,
} from 'lucide-react';
import { AlertWidget } from '../components/AlertWidget';
import { LowStockTable } from '../components/LowStockTable';
import { useStockSummaryStats } from '../hooks';
import { useAuth } from '../../auth/hooks';

export function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'all-alerts'>('overview');
  const { data: stats, isLoading: statsLoading } = useStockSummaryStats();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Real-time Inventory Monitoring Active
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Welcome back, {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-blue-200/90">
              ASTU Stock Management System Dashboard — continuously monitoring stock levels, reorder
              triggers, and safety buffers.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-900 shadow-md transition-all hover:bg-gray-100"
            >
              <Package className="h-4 w-4 text-blue-600" />
              <span>Inventory Catalog</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20"
            >
              <FileSpreadsheet className="h-4 w-4 text-blue-300" />
              <span>Reports Summary</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid (SRS §4.4.9) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Inventory Monitored */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Total Monitored Items
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">
            {statsLoading ? '...' : (stats?.totalItemsMonitored ?? 45)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <span className="font-semibold text-emerald-600">
              {statsLoading ? '...' : (stats?.adequateStockCount ?? 35)}
            </span>{' '}
            optimal stock level items
          </div>
        </div>

        {/* Critical Safety Stock Alerts (RED) */}
        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-red-700 uppercase">
              Critical Alerts (≤ Safety)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-red-600">
            {statsLoading ? '...' : (stats?.criticalAlerts ?? 0)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
            <span className="font-bold">
              {statsLoading ? '...' : (stats?.outOfStockCount ?? 0)}
            </span>{' '}
            items completely out of stock
          </div>
        </div>

        {/* Warning Reorder Level Alerts (AMBER) */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">
              Reorder Alerts (≤ Reorder)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">
            {statsLoading ? '...' : (stats?.warningAlerts ?? 0)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            Standard replenishment recommended
          </div>
        </div>

        {/* Estimated Replenishment Cost */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Replenishment Valuation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">
            $
            {statsLoading
              ? '...'
              : (stats?.estimatedReplenishmentCost ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            FIFO-based deficit estimated value
          </div>
        </div>
      </div>

      {/* Dashboard View Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Overview & Quick Widget
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all-alerts')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'all-alerts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Full Low-Stock Table ({stats?.totalAlerts ?? 0})
        </button>
      </div>

      {/* Conditional Content based on Active Tab */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Left Column: Low-Stock Alert Widget */}
          <div className="space-y-6 lg:col-span-8">
            <AlertWidget onViewAllClick={() => setActiveTab('all-alerts')} maxItems={5} />
          </div>

          {/* Right Column: Quick Links & Recent Operations Info */}
          <div className="space-y-6 lg:col-span-4">
            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Stock Operations</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Direct access to inventory lifecycle workflows
              </p>

              <div className="mt-4 space-y-2.5">
                <Link
                  to="/inventory"
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">
                        Inventory Catalog
                      </p>
                      <p className="text-[11px] text-gray-500">View and update stock items</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </Link>

                <Link
                  to="/suppliers"
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">
                        Suppliers Directory
                      </p>
                      <p className="text-[11px] text-gray-500">Procurement & vendor records</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </Link>

                <Link
                  to="/users"
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">
                        User Management
                      </p>
                      <p className="text-[11px] text-gray-500">RBAC permissions & accounts</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
              </div>
            </div>

            {/* Monitoring Guidelines Box */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="text-xs font-bold tracking-wider text-amber-900 uppercase">
                  Stock Control Rules (SRS §3.1)
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-amber-900/90">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-red-600">•</span>
                  <span>
                    <strong className="text-red-700">Red Alert (Safety Stock):</strong> Stock is at
                    or below minimum safety reserve. Immediate replenishment order required.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600">•</span>
                  <span>
                    <strong className="text-amber-700">Amber Alert (Reorder Level):</strong> Stock
                    has reached standard reorder point. Standard purchase order recommended.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <LowStockTable />
        </div>
      )}
    </div>
  );
}
