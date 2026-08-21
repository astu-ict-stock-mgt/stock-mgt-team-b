import { useState } from 'react';
import { useStockTakeItems, useSubmitStockTake } from '../hooks';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function CountWorksheet() {
  const [reason, setReason] = useState('');
  const [editableCounts, setEditableCounts] = useState<Record<string, number>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data, isLoading, isError } = useStockTakeItems();
  const { mutate: submitStockTake, isPending } = useSubmitStockTake();

  const items = data?.data ?? [];

  const handleCountChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditableCounts((prev) => ({ ...prev, [id]: numValue }));
    setSelectedItemId(id);
  };

  const getDiscrepancy = (item: any) => {
    const actual = editableCounts[item.id] ?? item.systemQuantity;
    return item.systemQuantity - actual;
  };

  const handleSubmit = () => {
    if (!selectedItemId) return;
    const actualQty = editableCounts[selectedItemId];
    if (actualQty === undefined) return;

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    const discrepancy = item.systemQuantity - actualQty;

    // Acceptance Criteria #2: Requires a reason before submission (if discrepancy exists)
    if (discrepancy !== 0 && !reason.trim()) {
      alert('A reason is required for discrepancies before submitting.');
      return;
    }

    submitStockTake({
      itemId: selectedItemId,
      actualQuantity: actualQty,
      reason: reason.trim(),
    }, {
      onSuccess: () => {
        setEditableCounts((prev) => ({ ...prev, [selectedItemId]: actualQty }));
        setReason('');
        setSelectedItemId(null);
      },
    });
  };

  if (isLoading) return <div className="p-6 text-center text-gray-400">Loading inventory data...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load inventory.</div>;

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Physical Stock Count</h2>
        <p className="text-sm text-gray-500">Enter actual counts and provide a reason for any discrepancies.</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => {
              const discrepancy = getDiscrepancy(item);
              const isReconciled = item.actualQuantity !== null || editableCounts[item.id] !== undefined;

              return (
                <tr key={item.id} className={isReconciled ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{item.itemCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.systemQuantity}</td>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="number"
                      min="0"
                      className={`w-20 rounded-md border px-2 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none ${
                        editableCounts[item.id] === undefined ? 'border-gray-300' : 'border-blue-300'
                      }`}
                      placeholder="Count"
                      value={editableCounts[item.id] ?? ''}
                      onChange={(e) => handleCountChange(item.id, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {/* Acceptance Criteria #1: Discrepancies visually highlighted */}
                    {isReconciled && discrepancy !== 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          discrepancy > 0
                            ? 'bg-red-100 text-red-700'  // Shortage
                            : 'bg-yellow-100 text-yellow-700' // Surplus
                        }`}
                      >
                        {discrepancy > 0 ? `Shortage: ${discrepancy}` : `Surplus: ${Math.abs(discrepancy)}`}
                        <AlertCircle className="h-3 w-3" />
                      </span>
                    ) : isReconciled && discrepancy === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Exact Match <CheckCircle2 className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Submission Footer */}
      {selectedItemId && (
        <div className="border-t border-gray-200 bg-gray-50/80 p-6 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for adjustment (required if discrepancy exists)</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
              placeholder="E.g. Damaged during transport, misplaced, supplier returned..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Submitting...' : 'Submit Reconciliation'}
          </button>
        </div>
      )}
    </div>
  );
}