import { Wallet, TrendingDown, AlertTriangle, Layers } from 'lucide-react';
import type { AccountantFinancialSummary } from '../types';

interface FinancialSummaryCardsProps {
  summary?: AccountantFinancialSummary;
  loading: boolean;
}

export function FinancialSummaryCards({ summary, loading }: FinancialSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-xs"
          />
        ))}
      </div>
    );
  }

  const formatCurrency = (val?: number) =>
    (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Inventory Asset Value */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-white to-emerald-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Total Inventory Value
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-gray-900">
            ETB {formatCurrency(summary?.totalInventoryValue)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {summary?.totalItemsCount || 0} catalog items in stock
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Valued strictly via FIFO active lots
        </div>
      </div>

      {/* Month-to-Date Consumed Value */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white to-blue-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            MTD Material Issues
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-gray-900">
            ETB {formatCurrency(summary?.monthToDateConsumedValue)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Current fiscal period consumption (COGS)</p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-blue-700">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          FIFO lot cost depletion
        </div>
      </div>

      {/* Total Write-Off Losses */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-linear-to-br from-white to-rose-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Write-Off Losses
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-rose-600">
            ETB {formatCurrency(summary?.totalWriteOffLosses)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Approved damaged & obsolete write-offs</p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-rose-700">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
          Financial capital write-down
        </div>
      </div>

      {/* Active FIFO Cost Layers */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-white to-indigo-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Active Cost Layers
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-gray-900">
            {summary?.activeCostLayersCount || 0}
          </div>
          <p className="mt-1 text-xs text-gray-500">Lots with positive unconsumed quantities</p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-indigo-700">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
          Oldest lot prioritized first
        </div>
      </div>
    </div>
  );
}
