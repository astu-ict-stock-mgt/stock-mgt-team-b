// client/src/features/damaged-obsolete/components/WriteOffHistory.tsx

import React, { useState, useEffect } from 'react';
import {
  useWriteOffHistory,
  useApproveWriteOff,
  useRejectWriteOff,
  useDisposeItems,
  useApprovalAuthority,
} from '../hooks';
import { getStatusConfig } from '../api';
import type { WriteOffResponse } from '../api';

export const WriteOffHistory: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WriteOffResponse | null>(null);
  const [showDisposeConfirm, setShowDisposeConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { isAuthorized } = useApprovalAuthority();
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useWriteOffHistory(statusFilter !== 'ALL' ? { status: statusFilter } : undefined);

  const approveMutation = useApproveWriteOff();
  const rejectMutation = useRejectWriteOff();
  const disposeMutation = useDisposeItems();

  useEffect(() => {
    const handleUpdate = () => refetch();
    window.addEventListener('inventory-update', handleUpdate);
    return () => window.removeEventListener('inventory-update', handleUpdate);
  }, [refetch]);

  const filteredHistory = history.filter(
    (request: WriteOffResponse) =>
      request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reasonCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    if (!window.confirm('Approve this write-off request?')) return;
    await approveMutation.mutateAsync(id);
    refetch();
  };

  const handleReject = (request: WriteOffResponse) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    await rejectMutation.mutateAsync({ id: selectedRequest.id, reason: rejectReason });
    setShowRejectDialog(false);
    setSelectedRequest(null);
    setRejectReason('');
    refetch();
  };

  const handleDispose = (request: WriteOffResponse) => {
    setSelectedRequest(request);
    setShowDisposeConfirm(true);
  };

  const confirmDispose = async () => {
    if (!selectedRequest) return;
    await disposeMutation.mutateAsync(selectedRequest.id);
    setShowDisposeConfirm(false);
    setSelectedRequest(null);
    refetch();
  };

  const renderStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text} flex w-fit items-center gap-1.5`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-3 text-gray-600">Loading write-off history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          ❌ Error loading history: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Write-Off History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage damaged/obsolete stock write-off requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorized && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              ● Approver
            </span>
          )}
          <span className="text-sm text-gray-500">SRS 1.4.2</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-md min-w-[200px] flex-1">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <svg
                className="absolute top-2.5 left-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISPOSED">Disposed</option>
              </select>
              <button
                onClick={() => refetch()}
                className="rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
              >
                ⟳ Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg">No write-off requests found</p>
              <p className="text-sm text-gray-400">Create a new request using the form above</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredHistory.map((request: WriteOffResponse) => (
                  <tr key={request.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{request.itemName}</div>
                      <div className="font-mono text-xs text-gray-500">
                        ID: {request.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{request.quantity}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {request.reasonCode}
                      </span>
                      {request.reasonDescription && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          {request.reasonDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.requestedBy || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {isAuthorized && request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending}
                              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              disabled={rejectMutation.isPending}
                              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isAuthorized && request.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDispose(request)}
                            disabled={disposeMutation.isPending}
                            className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          >
                            Dispose
                          </button>
                        )}
                        {!isAuthorized && request.status === 'PENDING' && (
                          <span className="text-xs text-gray-400">Awaiting approval</span>
                        )}
                      </div>
                      {request.notes && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <span>📝</span> {request.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredHistory.length}</span> of{' '}
            <span className="font-medium">{history.length}</span> requests
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700">
              1
            </button>
            <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {showDisposeConfirm && selectedRequest && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Disposal</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm">
                <span className="font-medium">Item:</span> {selectedRequest.itemName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Quantity:</span> {selectedRequest.quantity}
              </p>
              <p className="text-sm">
                <span className="font-medium">Reason:</span> {selectedRequest.reasonCode}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDisposeConfirm(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDispose}
                disabled={disposeMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {disposeMutation.isPending ? 'Processing...' : 'Confirm Disposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && selectedRequest && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Reject Request</h3>
            <p className="mb-2 text-sm text-gray-600">Reason for rejection (optional):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter rejection reason..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteOffHistory;
