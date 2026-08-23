import type { StockStatusReportData } from '../types';

interface StockStatusReportTableProps {
  data: StockStatusReportData | null;
  loading: boolean;
  searchQuery: string;
}

export function StockStatusReportTable({
  data,
  loading,
  searchQuery,
}: StockStatusReportTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">
            Checking stock levels & safety buffers...
          </p>
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
      item.warehouseName.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q)
    );
  });

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DAMAGED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'OBSOLETE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESERVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Stock Health & Reorder Levels</h2>
          <p className="text-xs text-gray-500">
            Monitoring current stock versus minimum, safety, and reorder levels (SRS Section 3.1)
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            {data?.summary.lowStockItemsCount ?? 0} Low Stock
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
            {data?.summary.belowSafetyStockCount ?? 0} Critical
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Item Code & Name</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Warehouse</th>
              <th className="px-4 py-3.5">State</th>
              <th className="px-4 py-3.5 text-right">Current Stock</th>
              <th className="px-4 py-3.5 text-right">Reorder Level</th>
              <th className="px-4 py-3.5 text-right">Safety Stock</th>
              <th className="px-5 py-3.5 text-center">Health Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  No stock status records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.inventoryItemId} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-gray-900">{item.itemCode}</div>
                    <div className="text-xs text-gray-500">{item.itemName}</div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{item.categoryName}</td>
                  <td className="px-4 py-3.5 text-gray-600">{item.warehouseName}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${getStateBadge(
                        item.state
                      )}`}
                    >
                      {item.state}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-gray-900">
                    {item.currentStock.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-500">
                    {item.reorderLevel.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-500">
                    {item.safetyStock.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {item.isBelowSafetyStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                        CRITICAL
                      </span>
                    ) : item.isLowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        REORDER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        HEALTHY
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
  );
}
