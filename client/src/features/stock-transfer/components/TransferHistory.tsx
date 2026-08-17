// @ts-nocheck
import { useState } from 'react';
import { useTransferHistory } from '../hooks';

const ROW_STYLES = `
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .row-in {
    animation: rowIn 0.28s ease-out both;
  }
  .fade-in {
    animation: fadeIn 0.2s ease both;
  }
  .table-row-hover {
    transition: background-color 0.18s ease;
  }
  .table-row-hover:hover {
    background-color: #f0f7ff;
  }
  .page-btn {
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .page-btn:not(:disabled):hover {
    transform: translateY(-1.5px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.18);
  }
  .page-btn:not(:disabled):active {
    transform: translateY(0) scale(0.97);
  }
`;

/* ─── Quantity badge ──────────────────────────────────────────── */
function QtyBadge({ qty }) {
  const color =
    qty >= 20
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
      : qty >= 5
      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
      : 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {qty}
    </span>
  );
}

/* ─── Empty state ─────────────────────────────────────────────── */
function EmptyState({ hasSearch, search }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="fade-in flex flex-col items-center justify-center py-10 sm:py-14 text-center px-4">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl shadow-xs">
            {hasSearch ? '🔍' : '📋'}
          </div>
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {hasSearch ? 'No matching transfers found' : 'No transfers yet'}
          </p>
          <p className="mt-1 max-w-xs text-xs sm:text-sm text-gray-500">
            {hasSearch
              ? `No records found matching "${search}".`
              : 'Transfers executed from the form will appear in this log.'}
          </p>
        </div>
      </td>
    </tr>
  );
}

/* ─── Loading skeleton ────────────────────────────────────────── */
function LoadingRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-3 py-3.5 sm:px-4">
          <div className="h-3.5 animate-pulse rounded-full bg-gray-100" />
        </td>
      ))}
    </tr>
  ));
}

/* ─── Main TransferHistory Component ───────────────────────────── */
export function TransferHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const { data: transfers = [], isLoading } = useTransferHistory(searchQuery);

  const totalEntries = transfers.length;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / pageSize));
  const validPage    = Math.min(currentPage, totalPages);
  const startIndex   = (validPage - 1) * pageSize;
  const endIndex     = Math.min(startIndex + pageSize, totalEntries);
  const currentRows  = transfers.slice(startIndex, endIndex);

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  return (
    <>
      <style>{ROW_STYLES}</style>

      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        {/* Header with responsive search bar */}
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 sm:p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Transfer History</h2>
            <p className="text-xs text-gray-400">
              {isLoading ? 'Loading records…' : `${totalEntries} total record${totalEntries !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-60">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search history…"
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2 pl-9 pr-9 text-xs sm:text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-700"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th scope="col" className="w-10 px-3 py-3 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  #
                </th>
                <th scope="col" className="px-3 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Item
                </th>
                <th scope="col" className="px-3 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  From
                </th>
                <th scope="col" className="px-3 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  To
                </th>
                <th scope="col" className="px-3 py-3 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Qty
                </th>
                <th scope="col" className="px-3 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Date
                </th>
                <th scope="col" className="px-3 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <LoadingRows />
              ) : currentRows.length === 0 ? (
                <EmptyState hasSearch={!!searchQuery} search={searchQuery} />
              ) : (
                currentRows.map((transfer, idx) => (
                  <tr
                    key={transfer.id}
                    className="row-in table-row-hover"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                        {startIndex + idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900">
                      {transfer.itemName}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📤</span>
                        <span className="truncate">{transfer.fromLocationName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📥</span>
                        <span className="truncate">{transfer.toLocationName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <QtyBadge qty={transfer.quantity} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[11px] sm:text-xs text-gray-500">
                      {transfer.date}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                          {transfer.transferredBy?.[0] ?? 'A'}
                        </div>
                        <span className="truncate text-xs text-gray-600">{transfer.transferredBy}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination footer */}
        {!isLoading && totalEntries > 0 && (
          <div className="flex flex-col items-center justify-between gap-2.5 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:px-5">
            <p className="text-xs text-gray-500">
              Showing <strong className="font-bold text-gray-700">{startIndex + 1}</strong>–
              <strong className="font-bold text-gray-700">{endIndex}</strong> of{' '}
              <strong className="font-bold text-gray-700">{totalEntries}</strong>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="page-btn cursor-pointer inline-flex h-8 items-center gap-1 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`page-btn cursor-pointer h-8 w-8 rounded-xl text-xs font-bold shadow-2xs ${
                    validPage === p
                      ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/20'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="page-btn cursor-pointer inline-flex h-8 items-center gap-1 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
              >
                Next
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
