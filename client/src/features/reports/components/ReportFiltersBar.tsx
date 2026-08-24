import type { ReportFiltersState } from '../types';

interface ReportFiltersBarProps {
  filters: ReportFiltersState;
  onUpdateFilter: (key: keyof ReportFiltersState, value: string) => void;
  onReset: () => void;
}

export function ReportFiltersBar({ filters, onUpdateFilter, onReset }: ReportFiltersBarProps) {
  const setQuickRange = (preset: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from = new Date();

    if (preset === 'today') {
      from = now;
    } else if (preset === 'week') {
      from.setDate(now.getDate() - 7);
    } else if (preset === 'month') {
      from.setMonth(now.getMonth() - 1);
    } else if (preset === 'year') {
      from.setFullYear(now.getFullYear() - 1);
    }

    onUpdateFilter('dateFrom', from.toISOString().slice(0, 10));
    onUpdateFilter('dateTo', to);
  };

  const hasActiveFilters =
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.type) ||
    Boolean(filters.search);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by item code, name, category, or reference..."
            value={filters.search}
            onChange={(e) => onUpdateFilter('search', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pr-3 pl-9 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Date From & Date To */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">From:</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onUpdateFilter('dateFrom', e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">To:</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onUpdateFilter('dateTo', e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Transaction Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => onUpdateFilter('type', e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Transactions</option>
            <option value="RECEIVE">Receipts (RECEIVE)</option>
            <option value="ISSUE">Issues (ISSUE)</option>
            <option value="TRANSFER">Transfers (TRANSFER)</option>
            <option value="ADJUSTMENT">Adjustments (ADJUSTMENT)</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Presets & Reset */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-gray-100 pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-400">Quick ranges:</span>
          <button
            type="button"
            onClick={() => setQuickRange('today')}
            className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('week')}
            className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('month')}
            className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('year')}
            className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200"
          >
            This Year
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
