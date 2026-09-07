import { useState } from 'react';
import { useCreateStockTake, useSubmitCount, useInventoryItemsForWarehouse, useStockTake } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { Save, AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';

interface CountWorksheetProps {
  sessionId: string;
}

export function CountWorksheet({ sessionId }: CountWorksheetProps) {
  const { user } = useAuth();
  const { data: session } = useStockTake(sessionId);
  const { data: inventoryItems, isLoading, isError } = useInventoryItemsForWarehouse(session?.warehouseId);
  const { mutate: submitCount, isPending } = useSubmitCount(sessionId);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseInt(value) || 0;
    setCounts((prev) => ({ ...prev, [itemId]: num }));
  };

  const handleSubmit = (itemId: string) => {
    const physicalQty = counts[itemId];
    if (physicalQty === undefined) return;

    const item = inventoryItems?.find((i) => i.id === itemId);
    if (!item) return;

    const discrepancy = physicalQty - (item.currentStock ?? 0);
    if (discrepancy !== 0 && !reason.trim()) {
      alert('A reason is required for discrepancies before submitting.');
      return;
    }

    submitCount(
      { inventoryItemId: itemId, physicalQuantity: physicalQty },
      {
        onSuccess: () => {
          setCounts((prev) => ({ ...prev, [itemId]: physicalQty }));
          setReason('');
        },
      }
    );
  };

  if (isLoading) return <div className="p-6 text-center text-gray-400">Loading inventory items...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load inventory items.</div>;
  if (!inventoryItems || inventoryItems.length === 0)
    return <div className="p-6 text-center text-gray-400">No items found in this warehouse.</div>;

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Physical Stock Count</h2>
        <p className="text-sm text-gray-500">
          Session ID: {sessionId} · Warehouse: {session?.warehouseId} · Status: {session?.status}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {inventoryItems.map((item) => {
              const systemQty = item.currentStock ?? 0;
              const actual = counts[item.id] ?? '';
              const discrepancy = actual !== '' ? actual - systemQty : 0;
              const isCounted = actual !== '';

              return (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{item.itemCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{systemQty}</td>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="number"
                      min="0"
                      className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Count"
                      value={actual}
                      onChange={(e) => handleCountChange(item.id, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isCounted && discrepancy !== 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          discrepancy > 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {discrepancy > 0 ? `Shortage: ${discrepancy}` : `Surplus: ${Math.abs(discrepancy)}`}
                        <AlertCircle className="h-3 w-3" />
                      </span>
                    ) : isCounted && discrepancy === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Exact Match <CheckCircle2 className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!isCounted && (
                      <button
                        onClick={() => handleSubmit(item.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" /> Submit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Object.keys(counts).length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50/80 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for adjustments (required for discrepancies)
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            placeholder="E.g. Damaged during transport, misplaced, supplier returned..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}