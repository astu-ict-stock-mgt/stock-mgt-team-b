import { useState } from 'react';
import type { ValuationReportData } from '../types';

interface ValuationReportTableProps {
  data: ValuationReportData | null;
  loading: boolean;
  searchQuery: string;
}

export function ValuationReportTable({ data, loading, searchQuery }: ValuationReportTableProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Calculating FIFO inventory valuation...</p>
        </div>
      </div>
    );
  }

  const items = (data?.items || []).filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.itemCode.toLowerCase().includes(q) ||
      item.itemName.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.warehouseName.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">
              FIFO Inventory Valuation Report
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              FIFO Layered
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Valuation calculated against earliest active received cost layers (SRS Section 4.4.7)
          </p>
        </div>
        <div className="mt-2 text-xs text-gray-500 sm:mt-0 font-medium">
          Total Valuation:{' '}
          <span className="font-bold text-emerald-600 text-sm">
            ETB {(data?.summary.totalFifoValuation || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="w-8 px-4 py-3.5" />
              <th className="px-4 py-3.5">Item Code</th>
              <th className="px-4 py-3.5">Item Name & Category</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5 text-right">Quantity on Hand</th>
              <th className="px-4 py-3.5 text-right">Weighted Avg Cost</th>
              <th className="px-4 py-3.5 text-right">Total FIFO Value</th>
              <th className="px-5 py-3.5 text-center">Cost Layers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  No inventory valuation records found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isExpanded = expandedItemId === item.inventoryItemId;
                return (
                  <tbody key={item.inventoryItemId} className="divide-y divide-gray-50">
                    <tr
                      onClick={() => toggleExpand(item.inventoryItemId)}
                      className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center">
                        <svg
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{item.itemName}</div>
                        <div className="text-xs text-gray-500">{item.categoryName}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">{item.warehouseName}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                        {item.totalQuantityOnHand.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-600">
                        ETB {item.averageUnitCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        ETB {item.totalFifoValue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                          {item.lots.length} active lot{item.lots.length === 1 ? '' : 's'}
                        </span>
                      </td>
                    </tr>

                    {/* FIFO Cost Layers Expanded Drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={8} className="px-8 py-3.5">
                          <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
                            <div className="mb-2 flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                FIFO Cost Layers (Oldest Batch Consumed First)
                              </h4>
                              <span className="text-[11px] text-gray-400">
                                Traceable Stock Lots
                              </span>
                            </div>
                            {item.lots.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">
                                No active received batches currently in stock.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {item.lots.map((lot, idx) => (
                                  <div
                                    key={lot.lotId}
                                    className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-xs"
                                  >
                                    <div className="flex items-center justify-between font-semibold">
                                      <span className="text-blue-700 font-mono">
                                        Batch #{idx + 1}
                                      </span>
                                      <span className="text-gray-500">
                                        {new Date(lot.receivedDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex justify-between text-gray-600">
                                      <span>Units Remaining:</span>
                                      <span className="font-bold text-gray-900">
                                        {lot.quantityRemaining} of {lot.quantityReceived}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Lot Unit Cost:</span>
                                      <span className="font-semibold text-gray-800">
                                        ETB {lot.unitCost.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="mt-1 border-t border-gray-200/60 pt-1 flex justify-between font-bold text-emerald-700">
                                      <span>Lot Value:</span>
                                      <span>ETB {lot.totalLotValue.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
