import { useStockTakeItems, useProcessStockTake } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

export function ReconciliationReview() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const { data, isLoading, isError } = useStockTakeItems('pending');
  const { mutate: processStockTake, isPending } = useProcessStockTake();

  const items = data?.data ?? [];

  // Acceptance Criteria #3: Approve/Reject only visible to PAO/Administrator
  const canApprove = user?.role === 'PAO' || user?.role === 'ADMINISTRATOR';

  const handleDecision = (id: string, action: 'approve' | 'reject') => {
    if (!canApprove) return;
    processStockTake(
      { id, action, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setNotes('');
        },
      }
    );
  };

  if (isLoading)
    return <div className="py-6 text-center text-gray-400">Loading pending reconciliations...</div>;
  if (isError)
    return <div className="py-6 text-center text-red-500">Failed to load pending items.</div>;

  if (!canApprove) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-400 shadow-sm">
        You do not have permission to review and approve reconciliations.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Reconciliation Review</h2>
        <p className="text-sm text-gray-500">Review submitted counts and authorize corrections.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                System
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Discrepancy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => {
              const discrepancy = item.systemQuantity - (item.actualQuantity || 0);
              return (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.systemQuantity}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    {item.actualQuantity}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        discrepancy > 0
                          ? 'bg-red-100 text-red-700'
                          : discrepancy < 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {discrepancy === 0
                        ? '0'
                        : discrepancy > 0
                          ? `-${discrepancy}`
                          : `+${Math.abs(discrepancy)}`}
                    </span>
                  </td>
                  <td
                    className="max-w-[200px] truncate px-6 py-4 text-sm text-gray-500"
                    title={item.submittedReason}
                  >
                    {item.submittedReason || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDecision(item.id, 'approve')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleDecision(item.id, 'reject')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                  No pending reconciliations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Note Field for Approver */}
      <div className="flex items-end justify-end gap-4 border-t border-gray-200 bg-gray-50 p-6">
        <div className="max-w-sm flex-1">
          <label htmlFor="approverNotes" className="mb-1 block text-xs font-medium text-gray-500">
            Approver Notes (Optional)
          </label>
          <input
            id="approverNotes"
            type="text"
            placeholder="e.g. Checked physical stock, OK."
            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
