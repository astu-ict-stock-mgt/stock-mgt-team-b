import type { StockMovementReportData } from '../types';

interface StockMovementTableProps {
  data: StockMovementReportData | null;
  loading: boolean;
  searchQuery: string;
}

export function StockMovementTable({ data, loading, searchQuery }: StockMovementTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Loading stock movement ledger...</p>
        </div>
      </div>
    );
  }

  const transactions = (data?.transactions || []).filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.itemCode.toLowerCase().includes(q) ||
      tx.itemName.toLowerCase().includes(q) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(q)) ||
      (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(q)) ||
      (tx.supplierName && tx.supplierName.toLowerCase().includes(q))
    );
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ISSUE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TRANSFER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ADJUSTMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Stock Movement Ledger</h2>
          <p className="text-xs text-gray-500">
            Real-time audit record of all receipts, issues, transfers, and adjustments
          </p>
        </div>
        <div className="mt-2 text-xs text-gray-500 sm:mt-0 font-medium">
          Showing <span className="font-bold text-gray-900">{transactions.length}</span> movements
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-4 py-3.5">Item Code / Name</th>
              <th className="px-4 py-3.5">Location / Warehouse</th>
              <th className="px-4 py-3.5 text-right">Quantity</th>
              <th className="px-4 py-3.5 text-right">Unit Cost</th>
              <th className="px-4 py-3.5 text-right">Total Value</th>
              <th className="px-4 py-3.5">Reference No</th>
              <th className="px-4 py-3.5">Operator</th>
              <th className="px-5 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="mt-2 font-medium">No stock movement records found.</p>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${getTypeBadge(
                        tx.type
                      )}`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-gray-900">{tx.itemCode}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{tx.itemName}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    {tx.warehouseName || 'Main Warehouse'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                    {tx.type === 'ISSUE' ? `-${tx.quantity}` : `+${tx.quantity}`}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {tx.unitCost ? `ETB ${tx.unitCost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {tx.totalValue ? `ETB ${tx.totalValue.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                    {tx.referenceNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{tx.userName || 'System'}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
