// client/src/features/stock-issuing/components/RequisitionForm.tsx

import React, { useState } from 'react';
import { useInventoryItems, useCreateRequisition, useRequisitions } from '../hooks';
import { Plus, Trash2, AlertTriangle, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../auth/hooks';

interface SelectedItem {
  itemId: string;
  quantityRequested: number;
}

export const RequisitionForm: React.FC = () => {
  const { user } = useAuth();

  // Queries & Mutations
  const { data: inventory = [], isLoading: isInventoryLoading } = useInventoryItems();
  const { data: requisitions = [], isLoading: isReqsLoading } = useRequisitions();
  const { mutate: createRequisition, isPending: isSubmitting } = useCreateRequisition();

  // State
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [justification, setJustification] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for user's own requisitions (or all if admin simulating)
  const myRequisitions = requisitions.filter(
    (r) =>
      user?.role === 'ADMINISTRATOR' ||
      r.requesterId === user?.id ||
      r.requesterName === `${user?.firstName} ${user?.lastName}`
  );

  // Active item details for checking stock warnings
  const activeInvItem = inventory.find((i) => i.id === currentItemId);
  const isStockLowForActiveItem = activeInvItem ? currentQty > activeInvItem.quantity : false;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItemId || currentQty <= 0) return;

    // Check if item already added
    const existingIndex = selectedItems.findIndex((item) => item.itemId === currentItemId);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantityRequested += currentQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        { itemId: currentItemId, quantityRequested: currentQty },
      ]);
    }

    // Reset current item inputs
    setCurrentItemId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmitRequisition = () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item to your requisition.');
      return;
    }
    if (!justification.trim()) {
      alert('Please provide a justification for this request.');
      return;
    }

    const payload = {
      requesterId: user?.id || 'dept-head-user',
      requesterName: user ? `${user.firstName} ${user.lastName}` : 'Department Head',
      department: user?.department || 'Requesting Department',
      items: selectedItems,
      justification: justification.trim(),
    };

    createRequisition(payload, {
      onSuccess: () => {
        setSuccessMsg('Requisition submitted successfully!');
        setSelectedItems([]);
        setJustification('');
        setShowForm(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      },
      onError: (err) => {
        alert(`Failed to submit requisition: ${(err as Error).message}`);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle className="h-3 w-3" /> Issued
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Requisitions (Department Head View)</h2>
          <p className="text-sm text-gray-500">
            Draft, submit, and track stock requisition requests.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'New Requisition'}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          ✓ {successMsg}
        </div>
      )}

      {/* Requisition Submission Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b border-gray-100 pb-2 text-lg font-semibold text-gray-800">
            Create Requisition Request
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left side inputs: Add item form */}
            <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 md:col-span-1">
              <h4 className="text-sm font-semibold text-gray-700">Add Item to Request</h4>

              <form onSubmit={handleAddItem} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Select Material
                  </label>
                  {isInventoryLoading ? (
                    <div className="py-2 text-xs text-gray-400">Loading materials...</div>
                  ) : (
                    <select
                      value={currentItemId}
                      onChange={(e) => {
                        setCurrentItemId(e.target.value);
                        setCurrentQty(1);
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.quantity} {item.unit} available)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeInvItem && (
                  <div className="space-y-0.5 rounded bg-blue-50/50 p-2.5 text-xs text-blue-800">
                    <p className="font-semibold">Code: {activeInvItem.itemCode}</p>
                    <p>
                      Current Stock:{' '}
                      <span className="font-bold">
                        {activeInvItem.quantity} {activeInvItem.unit}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentQty}
                    onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Acceptance Criteria #1: Warnings if quantity requested exceeds available stock */}
                {isStockLowForActiveItem && activeInvItem && (
                  <div className="flex gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600" />
                    <div>
                      <p className="font-semibold">Insufficient Stock Alert</p>
                      <p>
                        Requested quantity ({currentQty}) exceeds available stock (
                        {activeInvItem.quantity}). Requisition can still be drafted, but Storekeeper
                        may be unable to issue it.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!currentItemId}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-800 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add to List
                </button>
              </form>
            </div>

            {/* Right side list: Request items table */}
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700">Requested Items Draft</h4>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Item Details
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Qty Needed
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedItems.map((item, idx) => {
                      const invItem = inventory.find((i) => i.id === item.itemId);
                      const isQtyExceeded = invItem
                        ? item.quantityRequested > invItem.quantity
                        : false;

                      return (
                        <tr key={item.itemId} className={isQtyExceeded ? 'bg-yellow-50/20' : ''}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {invItem ? invItem.name : 'Unknown Item'}
                            </div>
                            <div className="font-mono text-xs text-gray-400">ID: {item.itemId}</div>
                            {isQtyExceeded && invItem && (
                              <span className="mt-1 inline-flex items-center gap-0.5 rounded bg-yellow-100/50 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" /> Exceeds Stock
                                ({invItem.quantity} avail)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                            {item.quantityRequested} {invItem?.unit || 'Units'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-red-500 transition hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {selectedItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                          Draft is empty. Select materials on the left to build requisition.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Justification (Purpose of requisition)
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="E.g., Required for upcoming audit review and department documentation folders."
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItems([]);
                    setJustification('');
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Discard Requisition
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRequisition}
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h3 className="text-md font-semibold text-gray-800">
            Past Requisitions & Status History
          </h3>
        </div>

        <div className="overflow-x-auto">
          {isReqsLoading ? (
            <div className="py-12 text-center text-gray-400">Loading history...</div>
          ) : myRequisitions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium">No past requisitions found</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Submit a requisition to see it logged here.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Req No / Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Materials Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Justification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Workflow Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {myRequisitions
                  .slice()
                  .reverse()
                  .map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-800">
                          {req.requisitionNumber}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="list-inside list-disc space-y-0.5 text-sm text-gray-700">
                          {req.items.map((it, i) => (
                            <li key={i}>
                              {it.itemName}{' '}
                              <span className="font-semibold text-gray-900">
                                x{it.quantityRequested}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                        {req.justification}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="space-y-1 px-6 py-4 text-xs text-gray-500">
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="rounded border border-red-100 bg-red-50 p-2 text-red-800">
                            <p className="text-[9px] font-semibold tracking-wider text-red-500 uppercase">
                              Reason for Rejection
                            </p>
                            <p className="mt-0.5 font-medium">{req.rejectionReason}</p>
                          </div>
                        )}
                        {req.status === 'APPROVED' && (
                          <p>
                            Approved by {req.approvedBy} on{' '}
                            {new Date(req.approvedAt!).toLocaleDateString()}
                          </p>
                        )}
                        {req.status === 'ISSUED' && (
                          <div>
                            <p className="font-semibold text-green-700">Issued (SIV generated)</p>
                            <p className="mt-0.5 font-mono text-[10px]">SIV No: {req.sivNumber}</p>
                            <p className="mt-0.5">
                              Issued by {req.issuedBy} on{' '}
                              {new Date(req.issuedAt!).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {req.status === 'PENDING' && (
                          <p>Awaiting review by Property Administration Officer (PAO).</p>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
