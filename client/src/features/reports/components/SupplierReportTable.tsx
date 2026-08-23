import type { SupplierReportData } from '../types';

interface SupplierReportTableProps {
  data: SupplierReportData | null;
  loading: boolean;
  searchQuery: string;
}

export function SupplierReportTable({ data, loading, searchQuery }: SupplierReportTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Loading supplier delivery metrics...</p>
        </div>
      </div>
    );
  }

  const suppliers = (data?.suppliers || []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.supplierName.toLowerCase().includes(q) ||
      (s.contactName && s.contactName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Supplier Performance & Delivery Report
          </h2>
          <p className="text-xs text-gray-500">
            Fulfillment volume, delivery frequency, and monetary order metrics
          </p>
        </div>
        <div className="mt-2 text-xs font-medium text-gray-500 sm:mt-0">
          Total Value Supplied:{' '}
          <span className="text-sm font-bold text-blue-600">
            ETB {(data?.summary.totalValueSupplied || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Supplier Name</th>
              <th className="px-4 py-3.5">Contact Person</th>
              <th className="px-4 py-3.5">Contact Info</th>
              <th className="px-4 py-3.5 text-right">Shipments / Orders</th>
              <th className="px-4 py-3.5 text-right">Units Supplied</th>
              <th className="px-4 py-3.5 text-right">Total Supplied Value</th>
              <th className="px-5 py-3.5 text-right">Last Delivery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  No supplier performance records found.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.supplierId} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-gray-900">{s.supplierName}</div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">{s.contactName || '-'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    <div>{s.email || '-'}</div>
                    <div className="text-[11px] text-gray-400">{s.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {s.totalDeliveries} order{s.totalDeliveries === 1 ? '' : 's'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-blue-600">
                    {s.totalQuantitySupplied.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                    ETB {s.totalSuppliedValue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs whitespace-nowrap text-gray-500">
                    {s.lastDeliveryDate
                      ? new Date(s.lastDeliveryDate).toLocaleDateString()
                      : 'No deliveries'}
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
