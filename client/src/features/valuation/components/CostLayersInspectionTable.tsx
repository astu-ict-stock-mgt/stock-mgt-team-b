import { useState } from 'react';
import { Layers, Calendar, Clock, Download } from 'lucide-react';
import type { CostLayersResponse, AgingBracket } from '../types';
import { exportValuationCsv } from '../api';

interface CostLayersInspectionTableProps {
  data?: CostLayersResponse;
  loading: boolean;
  searchQuery: string;
}

export function CostLayersInspectionTable({
  data,
  loading,
  searchQuery,
}: CostLayersInspectionTableProps) {
  const [selectedBracket, setSelectedBracket] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'depleted'>('active');
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getAgingBadgeColor = (bracket: AgingBracket) => {
    switch (bracket) {
      case '0-30 days':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '31-60 days':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '61-90 days':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '>90 days':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportValuationCsv('cost-layers');
    } catch (err) {
      console.error('Failed to export cost layers CSV', err);
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
            Analyzing FIFO cost layers and aging brackets...
          </p>
        </div>
      </div>
    );
  }

  const allLots = data?.lots || [];
  const filteredLots = allLots.filter((lot) => {
    if (statusFilter === 'active' && lot.isDepleted) return false;
    if (statusFilter === 'depleted' && !lot.isDepleted) return false;
    if (selectedBracket !== 'all' && lot.agingBracket !== selectedBracket) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        lot.itemCode.toLowerCase().includes(q) ||
        lot.itemName.toLowerCase().includes(q) ||
        lot.categoryName.toLowerCase().includes(q) ||
        lot.warehouseName.toLowerCase().includes(q) ||
        lot.lotId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const agingBreakdown = data?.summary.agingBreakdown;

  return (
    <div className="space-y-4">
      {/* Aging Distribution Header Cards */}
      {agingBreakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              setSelectedBracket(selectedBracket === '0-30 days' ? 'all' : '0-30 days')
            }
            className={`cursor-pointer rounded-xl border p-3 text-left transition ${
              selectedBracket === '0-30 days'
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>0-30 Days (Fresh)</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold">
                {agingBreakdown['0-30 days'].count} lots
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900">
              ETB {formatCurrency(agingBreakdown['0-30 days'].value)}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedBracket(selectedBracket === '31-60 days' ? 'all' : '31-60 days')
            }
            className={`cursor-pointer rounded-xl border p-3 text-left transition ${
              selectedBracket === '31-60 days'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
              <span>31-60 Days</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold">
                {agingBreakdown['31-60 days'].count} lots
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900">
              ETB {formatCurrency(agingBreakdown['31-60 days'].value)}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedBracket(selectedBracket === '61-90 days' ? 'all' : '61-90 days')
            }
            className={`cursor-pointer rounded-xl border p-3 text-left transition ${
              selectedBracket === '61-90 days'
                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                : 'border-gray-200 bg-white hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
              <span>61-90 Days</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold">
                {agingBreakdown['61-90 days'].count} lots
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900">
              ETB {formatCurrency(agingBreakdown['61-90 days'].value)}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBracket(selectedBracket === '>90 days' ? 'all' : '>90 days')}
            className={`cursor-pointer rounded-xl border p-3 text-left transition ${
              selectedBracket === '>90 days'
                ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400'
                : 'border-gray-200 bg-white hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
              <span>&gt;90 Days (Aging)</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold">
                {agingBreakdown['>90 days'].count} lots
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900">
              ETB {formatCurrency(agingBreakdown['>90 days'].value)}
            </div>
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {/* Table Header Controls */}
        <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">FIFO Cost Layers Breakdown</h3>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Layered Cost Basis
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Individual received stock batches sorted in FIFO order (oldest received date consumed
              first)
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">
            {/* Status Filter */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active Lots
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('depleted')}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                  statusFilter === 'depleted'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Depleted
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Lots
              </button>
            </div>

            {/* Export Button */}
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3.5">Lot ID / Batch</th>
                <th className="px-4 py-3.5">Item Details</th>
                <th className="px-4 py-3.5">Category & Location</th>
                <th className="px-4 py-3.5">Received Date</th>
                <th className="px-4 py-3.5 text-center">Age</th>
                <th className="px-4 py-3.5 text-right">Received Qty</th>
                <th className="px-4 py-3.5 text-right">Remaining Qty</th>
                <th className="px-4 py-3.5 text-right">Unit Cost (ETB)</th>
                <th className="px-4 py-3.5 text-right">Lot Valuation (ETB)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                    <Layers className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 font-medium">No matching FIFO cost layers found.</p>
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => (
                  <tr key={lot.lotId} className="transition hover:bg-indigo-50/30">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-indigo-700">
                      {lot.lotId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{lot.itemCode}</div>
                      <div className="text-xs text-gray-500">{lot.itemName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-gray-900">{lot.categoryName}</div>
                      <div className="text-xs text-gray-500">{lot.warehouseName}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(lot.receivedDate).toISOString().split('T')[0]}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {lot.ageInDays}d
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getAgingBadgeColor(
                            lot.agingBracket
                          )}`}
                        >
                          {lot.agingBracket}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-gray-600">
                      {lot.quantityReceived.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                      {lot.quantityRemaining.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-gray-700">
                      {formatCurrency(lot.unitCost)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(lot.totalLotValue)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {lot.isDepleted ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                          Depleted
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Active
                        </span>
                      )}
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
