import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Building2,
} from 'lucide-react';
import { useStockAlerts } from '../hooks';
import type { StockAlertItem } from '../types';

interface AlertWidgetProps {
  onViewAllClick?: () => void;
  maxItems?: number;
}

export function AlertWidget({ onViewAllClick, maxItems = 5 }: AlertWidgetProps) {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  const { data, isLoading, isError, refetch, isFetching } = useStockAlerts(
    {
      severity: severityFilter,
      page: 1,
      pageSize: maxItems,
    },
    {
      refetchInterval: 15000, // Auto-poll every 15s for live dashboard responsiveness
    }
  );

  const items = data?.data ?? [];
  const totalAlerts = data?.totalCount ?? 0;
  const criticalCount = data?.criticalCount ?? 0;
  const warningCount = data?.warningCount ?? 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">Low-Stock Alerts</h2>
              {/* Live Pulsing Dot */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Items at or below safety stock & reorder thresholds
            </p>
          </div>
        </div>

        {/* Controls: Severity Filter Pills + Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-gray-100/80 p-1 text-xs font-medium text-gray-600">
            <button
              type="button"
              onClick={() => setSeverityFilter('ALL')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                severityFilter === 'ALL'
                  ? 'bg-white font-semibold text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({totalAlerts})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                severityFilter === 'CRITICAL'
                  ? 'bg-red-600 font-semibold text-white shadow-xs'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Critical ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('WARNING')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                severityFilter === 'WARNING'
                  ? 'bg-amber-500 font-semibold text-white shadow-xs'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Warning ({warningCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh stock alerts"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50"
            aria-label="Refresh stock alerts"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Severity Strip */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/40 text-center sm:grid-cols-3">
        <div className="p-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            Critical (Below Safety)
          </div>
          <p className="mt-0.5 text-lg font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Warning (Reorder Level)
          </div>
          <p className="mt-0.5 text-lg font-bold text-amber-600">{warningCount}</p>
        </div>
        <div className="col-span-2 border-t border-gray-100 p-3 sm:col-span-1 sm:border-t-0">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600">
            <TrendingDown className="h-3.5 w-3.5 text-gray-500" />
            Total Deficit Items
          </div>
          <p className="mt-0.5 text-lg font-bold text-gray-900">{totalAlerts}</p>
        </div>
      </div>

      {/* Alert Items List */}
      <div className="divide-y divide-gray-100 p-2 sm:p-3">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
                <div className="mt-2 h-3 w-48 rounded bg-gray-200" />
                <div className="mt-3 h-2 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-semibold text-gray-900">Failed to load alerts</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">All Stock Levels Optimal</p>
            <p className="mt-1 text-xs text-gray-500">
              No items currently require urgent reordering or safety replenishment.
            </p>
          </div>
        ) : (
          items.map((item: StockAlertItem) => {
            const isCritical = item.severity === 'CRITICAL';
            // Calculate percentage of stock relative to reorder level
            const stockPct = Math.min(
              100,
              Math.max(0, Math.round((item.currentQuantity / (item.reorderLevel || 1)) * 100))
            );

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-3.5 transition-all hover:shadow-xs sm:p-4 ${
                  isCritical
                    ? 'border-red-200/70 bg-red-50/20 hover:border-red-300 hover:bg-red-50/40'
                    : 'border-amber-200/70 bg-amber-50/20 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  {/* Item Details with Link to Inventory Detail */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/inventory?itemCode=${encodeURIComponent(item.itemCode)}`}
                        className="inline-flex items-center gap-1.5 font-bold text-gray-900 hover:text-blue-600 hover:underline"
                        title={`View inventory detail for ${item.itemCode}`}
                      >
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{item.itemCode}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>

                      {/* Severity Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                          isCritical
                            ? 'border border-red-200 bg-red-100 text-red-800'
                            : 'border border-amber-200 bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isCritical ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            {item.status === 'OUT_OF_STOCK'
                              ? 'Out of Stock'
                              : 'Critical (≤ Safety)'}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            Reorder Warning
                          </>
                        )}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-gray-800">
                      {item.name}
                    </p>

                    {/* Metadata tags */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {item.warehouse}
                      </span>
                    </div>
                  </div>

                  {/* Stock Counts & Deficit Pill */}
                  <div className="mt-2 flex shrink-0 items-center justify-between sm:mt-0 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-500">Current Stock: </span>
                      <span
                        className={`text-sm font-extrabold ${
                          isCritical ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {item.currentQuantity} {item.unit}
                      </span>
                    </div>
                    <div className="mt-1 rounded-md border border-gray-200/80 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-2xs">
                      Reorder at: {item.reorderLevel} | Safety: {item.safetyStock}
                    </div>
                  </div>
                </div>

                {/* Visual Progress / Fill Level Bar */}
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-gray-500">
                    <span>Stock Level ({stockPct}% of reorder threshold)</span>
                    <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                      Shortage: -{item.shortageQuantity} {item.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3 text-xs sm:px-6">
        <span className="text-gray-500">
          Showing {items.length} of {totalAlerts} low-stock items
        </span>
        {onViewAllClick ? (
          <button
            type="button"
            onClick={onViewAllClick}
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800"
          >
            <span>View Full Table</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Go to Inventory Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
