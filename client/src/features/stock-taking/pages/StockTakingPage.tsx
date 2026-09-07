import { useState } from 'react';
import { useReconciliations, useApproveReconciliation, useRejectReconciliation } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { Check, X } from 'lucide-react';

interface ReconciliationReviewProps {
  sessionId: string;
}

export function ReconciliationReview({ sessionId }: ReconciliationReviewProps) {
  const { user } = useAuth();
  const { data: reconciliations, isLoading, isError } = useReconciliations(sessionId);
  const { mutate: approve, isPending: isApproving } = useApproveReconciliation();
  const { mutate: reject, isPending: isRejecting } = useRejectReconciliation();

  const [reason, setReason] = useState('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [actionTarget, setActionTarget] = useState<string | null>(null);

  const canApprove = user?.role === 'PAO' || user?.role === 'ADMINISTRATOR';

  const handleApprove = (reconciliationId: string) => {
    if (!canApprove) return;
    if (!reason.trim()) {
      alert('Please provide a reason for approval.');
      return;
    }
    const cost = unitCost ? parseFloat(unitCost) : undefined;
    approve(
      { reconciliationId, reason: reason.trim(), unitCost: cost },
      {
        onSuccess: () => {
          setReason('');
          setUnitCost('');
          setActionTarget(null);
        },
      }
    );
  };

  const handleReject = (reconciliationId: string) => {
    if (!canApprove) return;
    if (!reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    reject(
      { reconciliationId, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('');
          setUnitCost('');
          setActionTarget(null);
        },
      }
    );
  };

  if (isLoading) return <div className="text-center py-6 text-gray-400">Loading reconciliations...</div>;
  if (isError) return <div className="text-center py-6 text-red-500">Failed to load reconciliations.</div>;
  if (!canApprove) {
    return (
      <div className="p-6 text-center text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
        You do not have permission to review and approve reconciliations.
      </div>
    );
  }

  const pendingReconciliations = reconciliations?.filter((r) => r.status === 'PENDING') ?? [];

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Reconciliation Review</h2>
        <p className="text-sm text-gray-500">Session: {sessionId}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discrepancy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pendingReconciliations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">No pending reconciliations.</td>
              </tr>
            ) : (
              pendingReconciliations.map((rec) => {
                const item = rec.inventoryItem || rec.stockTakeCount?.inventoryItem;
                const systemQty = rec.stockTakeCount?.systemQuantity ?? 0;
                const actualQty = rec.stockTakeCount?.physicalQuantity ?? 0;
                const discrepancy = rec.discrepancy;
                return (
                  <tr key={rec.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item?.itemName ?? 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{systemQty}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{actualQty}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        discrepancy > 0 ? 'bg-red-100 text-red-700' :
                        discrepancy < 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {discrepancy === 0 ? '0' : (discrepancy > 0 ? `-${discrepancy}` : `+${Math.abs(discrepancy)}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rec.status}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setActionTarget(rec.id); setReason(''); setUnitCost(''); }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {actionTarget && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Review Reconciliation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason (required)</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Verified physical count"
              />
            </div>
            {/* For positive discrepancies, unitCost is required */}
            {(() => {
              const rec = reconciliations?.find((r) => r.id === actionTarget);
              if (rec && rec.discrepancy > 0) {
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Cost (required for surplus)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="e.g. 125.50"
                    />
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(actionTarget)}
                disabled={isApproving}
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleReject(actionTarget)}
                disabled={isRejecting}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => setActionTarget(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}