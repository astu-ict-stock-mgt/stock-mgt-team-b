import type { IssuingReportData } from '../types';

interface IssuingReportTableProps {
  data: IssuingReportData | null;
  loading: boolean;
  searchQuery: string;
}

export function IssuingReportTable({ data, loading, searchQuery }: IssuingReportTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Loading stock issuing records...</p>
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
      (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(q)) ||
      (tx.department && tx.department.toLowerCase().includes(q)) ||
      tx.issuedByName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Stock Issuing Report (Issue Vouchers)
          </h2>
          <p className="text-xs text-gray-500">
            Records of inventory issued to departments, units, and approved requests
          </p>
        </div>
        <div className="mt-2 text-xs font-medium text-gray-500 sm:mt-0">
          Total Issues Value:{' '}
          <span className="font-bold text-purple-600">
            ETB {(data?.summary.totalValue || 0).toLocaleString()}
          </span>{' '}
          ({data?.summary.totalQuantity || 0} units)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Issue Voucher No</th>
              <th className="px-4 py-3.5">Item Code & Name</th>
              <th className="px-4 py-3.5">Department / Requisitioner</th>
              <th className="px-4 py-3.5">Issued From</th>
              <th className="px-4 py-3.5 text-right">Issued Qty</th>
              <th className="px-4 py-3.5 text-right">Unit Cost</th>
              <th className="px-4 py-3.5 text-right">Total Value</th>
              <th className="px-4 py-3.5">Issued By</th>
              <th className="px-5 py-3.5 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                  No stock issuing records match the selected criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-mono font-semibold text-purple-600">
                    {tx.referenceNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-gray-900">{tx.itemCode}</div>
                    <div className="text-xs text-gray-500">{tx.itemName}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      {tx.department || 'Organizational Unit'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{tx.warehouseName}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-purple-700">
                    -{tx.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {tx.unitCost ? `ETB ${tx.unitCost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {tx.totalValue ? `ETB ${tx.totalValue.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{tx.issuedByName}</td>
                  <td className="px-5 py-3.5 text-right text-xs whitespace-nowrap text-gray-500">
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
