import { useState } from 'react';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  AlertOctagon,
  Download,
  Scale,
} from 'lucide-react';
import type { FinancialLedgerResponse, FinancialTransactionType } from '../types';
import { exportValuationCsv } from '../api';

interface GeneralLedgerCostingTableProps {
  data?: FinancialLedgerResponse;
  loading: boolean;
  searchQuery: string;
}

export function GeneralLedgerCostingTable({
  data,
  loading,
  searchQuery,
}: GeneralLedgerCostingTableProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportValuationCsv('financial-ledger');
    } catch (err) {
      console.error('Failed to export ledger CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">
            Reconciling general ledger costing journal...
          </p>
        </div>
      </div>
    );
  }

  const entries = (data?.entries || []).filter((entry) => {
    if (selectedType !== 'all' && entry.transactionType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.itemCode.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(q)) ||
        (entry.details && entry.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const summary = data?.summary;

  const getTypeIcon = (type: FinancialTransactionType) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />;
      case 'ISSUE':
        return <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" />;
      case 'WRITE_OFF':
        return <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />;
      case 'STOCK_TAKE_ADJUSTMENT':
        return <Scale className="h-3.5 w-3.5 text-amber-600" />;
    }
  };

  const getTypeBadge = (type: FinancialTransactionType) => {
    switch (type) {
      case 'RECEIPT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ISSUE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WRITE_OFF':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'STOCK_TAKE_ADJUSTMENT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Ledger Journal Summary Banner */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <div className="text-xs font-semibold text-emerald-800 uppercase">
              Total Inbound Debits (Additions)
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              ETB {formatCurrency(summary.totalDebits)}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600">
              Purchases capitalized + stock take surpluses
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
            <div className="text-xs font-semibold text-rose-800 uppercase">
              Total Outbound Credits (Reductions)
            </div>
            <div className="mt-1 text-xl font-black text-rose-700">
              ETB {formatCurrency(summary.totalCredits)}
            </div>
            <p className="mt-1 text-[11px] text-rose-600">
              Issues consumed (COGS) + write-offs & deficits
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
            <div className="text-xs font-semibold text-indigo-800 uppercase">
              Net Inventory Movement
            </div>
            <div
              className={`mt-1 text-xl font-black ${
                summary.netMovement >= 0 ? 'text-indigo-900' : 'text-rose-700'
              }`}
            >
              {summary.netMovement >= 0 ? '+' : ''}ETB {formatCurrency(summary.netMovement)}
            </div>
            <p className="mt-1 text-[11px] text-indigo-600">
              Net inventory valuation change over selected period
            </p>
          </div>
        </div>
      )}

      {/* Main Ledger Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">General Ledger Costing Journal</h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Double-Entry Costing
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Formal audit trail of financial debits (asset receipts) and credits (consumption &
              write-downs)
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">
            {/* Type Filter Buttons */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
              {[
                { id: 'all', label: 'All' },
                { id: 'RECEIPT', label: 'Receipts' },
                { id: 'ISSUE', label: 'Issues' },
                { id: 'WRITE_OFF', label: 'Write-Offs' },
                { id: 'STOCK_TAKE_ADJUSTMENT', label: 'Adjustments' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedType(btn.id)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                    selectedType === btn.id
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Type & Ref</th>
                <th className="px-4 py-3.5">Item Details</th>
                <th className="px-4 py-3.5 text-right">Quantity</th>
                <th className="px-4 py-3.5 text-right">Unit Cost (ETB)</th>
                <th className="px-4 py-3.5 text-right font-bold text-emerald-700">Debit (+ ETB)</th>
                <th className="px-4 py-3.5 text-right font-bold text-rose-700">Credit (- ETB)</th>
                <th className="px-4 py-3.5">Operational Details & Authorized User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 font-medium">No ledger transactions found in this period.</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-gray-50/60">
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap text-gray-900">
                      {new Date(entry.date).toISOString().split('T')[0]}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(entry.transactionType)}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getTypeBadge(
                            entry.transactionType
                          )}`}
                        >
                          {entry.transactionType}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-gray-500">
                        {entry.referenceNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{entry.itemCode}</div>
                      <div className="text-xs text-gray-500">{entry.itemName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                      {entry.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-gray-600">
                      {formatCurrency(entry.unitCost)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-gray-800">{entry.details}</div>
                      <div className="text-[11px] text-gray-400">
                        By: {entry.userName || 'System'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
