import React, { useState } from 'react';
import { useReconciliations, useApproveReconciliation, useRejectReconciliation } from '../hooks';
import { useAuth } from '../../auth/hooks';
import type { ReconciliationItem } from '../types';
import {
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Building2,
  Clock,
  History,
  CheckCircle2,
} from 'lucide-react';

export const ReconciliationReview: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const { data: reconciliations, isLoading, isError } = useReconciliations();
  const { mutate: approveReconciliation, isPending: isApproving } = useApproveReconciliation();
  const { mutate: rejectReconciliation, isPending: isRejecting } = useRejectReconciliation();

  // Modal State for Approval / Rejection
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [unitCost, setUnitCost] = useState<number | ''>('');

  const canAuthorize = user?.role === 'PAO' || user?.role === 'ADMINISTRATOR';

  const pendingList = reconciliations?.filter((r) => r.status === 'PENDING') ?? [];
  const historyList = reconciliations?.filter((r) => r.status !== 'PENDING') ?? [];

  const handleOpenModal = (item: ReconciliationItem, type: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(type);
    setDecisionReason('');
    setUnitCost('');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setActionType(null);
    setDecisionReason('');
    setUnitCost('');
  };

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actionType) return;

    if (!decisionReason.trim()) {
      alert('A reason is required to process this reconciliation.');
      return;
    }

    if (actionType === 'approve') {
      // If surplus (discrepancy > 0), backend requires unitCost for FIFO lot valuation
      if (selectedItem.discrepancy > 0 && (unitCost === '' || Number(unitCost) <= 0)) {
        alert(
          'A positive unit cost is required when approving a stock surplus (FIFO lot valuation).'
        );
        return;
      }

      approveReconciliation(
        {
          reconciliationId: selectedItem.id,
          reason: decisionReason.trim(),
          unitCost: unitCost !== '' ? Number(unitCost) : undefined,
        },
        {
          onSuccess: () => handleCloseModal(),
        }
      );
    } else {
      rejectReconciliation(
        {
          reconciliationId: selectedItem.id,
          reason: decisionReason.trim(),
        },
        {
          onSuccess: () => handleCloseModal(),
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reconciliation Review & Approval</h2>
              <p className="text-xs text-gray-500">
                Authorize physical variance adjustments to bin card records and FIFO inventory
                valuation.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Queue</span>
            {pendingList.length > 0 && (
              <span className="py-0.2 ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History & Audits</span>
          </button>
        </div>
      </div>

      {!canAuthorize && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800">
          <p className="font-semibold">Read-Only Mode</p>
          <p className="mt-0.5">
            Only the <strong>Property Administration Officer (PAO)</strong> or{' '}
            <strong>Administrator</strong> is authorized to approve inventory variance adjustments.
          </p>
        </div>
      )}

      {/* Main Content Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading reconciliations...</div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-red-500">
            Failed to load reconciliation records from server.
          </div>
        ) : activeTab === 'pending' ? (
          pendingList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
              <p className="text-sm font-semibold text-gray-800">No Pending Discrepancies</p>
              <p className="mt-1 text-xs text-gray-400">
                All physical counts match system balances, or pending items have already been
                processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="px-5 py-3">Item Details</th>
                    <th className="px-5 py-3">Warehouse</th>
                    <th className="px-5 py-3 text-right">System Qty</th>
                    <th className="px-5 py-3 text-right">Physical Count</th>
                    <th className="px-5 py-3 text-center">Variance</th>
                    <th className="px-5 py-3">Reported By</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pendingList.map((item) => {
                    const isSurplus = item.discrepancy > 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900">{item.itemName}</div>
                          <div className="font-mono text-[10px] text-blue-600">{item.itemCode}</div>
                          <div className="text-[10px] text-gray-400">{item.category}</div>
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <span>{item.warehouseName}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono text-gray-700">
                          {item.systemQuantity}
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                          {item.physicalQuantity}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isSurplus ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {isSurplus
                                ? `Surplus (+${item.discrepancy})`
                                : `Shortage (${item.discrepancy})`}
                            </span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          <div>{item.countedBy}</div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(item.countedAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {canAuthorize ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenModal(item, 'approve')}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenModal(item, 'reject')}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400">Pending Authorization</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : /* History & Audits Tab */
        historyList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No historical reconciliations processed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3 text-right">Count Variance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Approver & Reason</th>
                  <th className="px-5 py-3 text-right">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {historyList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{item.itemName}</div>
                      <div className="font-mono text-[10px] text-blue-600">{item.itemCode}</div>
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">{item.warehouseName}</td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span className={item.discrepancy > 0 ? 'text-amber-600' : 'text-red-600'}>
                        {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          item.status === 'APPLIED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="font-medium text-gray-800">{item.approvedBy || 'PAO'}</div>
                      <div className="text-[11px] text-gray-500 italic">
                        &ldquo;{item.reason || 'Variance adjusted'}&rdquo;
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {item.approvedAt
                        ? new Date(item.approvedAt).toLocaleDateString()
                        : new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal (Approve or Reject) */}
      {selectedItem && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <h3 className="text-base font-bold text-gray-900">
              {actionType === 'approve'
                ? 'Authorize Inventory Adjustment'
                : 'Reject Physical Count Variance'}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {actionType === 'approve'
                ? 'Approving will immediately update the system bin card balance and adjust FIFO cost valuation.'
                : 'Rejecting keeps system inventory balances unchanged.'}
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{selectedItem.itemName}</p>
              <div className="mt-1 flex justify-between text-gray-600">
                <span>System: {selectedItem.systemQuantity}</span>
                <span>Physical: {selectedItem.physicalQuantity}</span>
                <span className="font-bold text-blue-600">
                  Variance:{' '}
                  {selectedItem.discrepancy > 0
                    ? `+${selectedItem.discrepancy}`
                    : selectedItem.discrepancy}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmDecision} className="mt-4 space-y-4">
              {actionType === 'approve' && selectedItem.discrepancy > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Unit Cost (ETB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="E.g. 45.00"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Required for FIFO: prices the incoming surplus stock lot layer.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why this adjustment is authorized or rejected..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving || isRejecting}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {isApproving || isRejecting
                    ? 'Processing...'
                    : actionType === 'approve'
                      ? 'Confirm & Apply Adjustment'
                      : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationReview;
