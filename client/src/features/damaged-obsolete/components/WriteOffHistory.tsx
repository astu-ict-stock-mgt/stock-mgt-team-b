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

export const WriteOffHistory: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
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

  const filteredHistory = history.filter((request: any) =>
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

  const handleReject = (request: any) => {
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

  const handleDispose = (request: any) => {
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
        className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1.5 w-fit`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-600">Loading write-off history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          ❌ Error loading history: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Write-Off History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage damaged/obsolete stock write-off requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorized && (
            <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              ● Approver
            </span>
          )}
          <span className="text-sm text-gray-500">SRS 1.4.2</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISPOSED">Disposed</option>
              </select>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
              >
                ⟳ Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No write-off requests found</p>
              <p className="text-sm text-gray-400">Create a new request using the form above</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{request.itemName}</div>
                      <div className="text-xs text-gray-500 font-mono">ID: {request.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{request.quantity}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                        {request.reasonCode}
                      </span>
                      {request.reasonDescription && (
                        <div className="text-xs text-gray-500 mt-0.5">{request.reasonDescription}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.requestedBy || 'N/A'}</td>
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
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              disabled={rejectMutation.isPending}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isAuthorized && request.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDispose(request)}
                            disabled={disposeMutation.isPending}
                            className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition"
                          >
                            Dispose
                          </button>
                        )}
                        {!isAuthorized && request.status === 'PENDING' && (
                          <span className="text-xs text-gray-400">Awaiting approval</span>
                        )}
                      </div>
                      {request.notes && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
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

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredHistory.length}</span> of{' '}
            <span className="font-medium">{history.length}</span> requests
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition">
              Previous
            </button>
            <button className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition">
              1
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">
              Next
            </button>
          </div>
        </div>
      </div>

      {showDisposeConfirm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Disposal</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm"><span className="font-medium">Item:</span> {selectedRequest.itemName}</p>
              <p className="text-sm"><span className="font-medium">Quantity:</span> {selectedRequest.quantity}</p>
              <p className="text-sm"><span className="font-medium">Reason:</span> {selectedRequest.reasonCode}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDisposeConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDispose}
                disabled={disposeMutation.isPending}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
              >
                {disposeMutation.isPending ? 'Processing...' : 'Confirm Disposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-2">Reason for rejection (optional):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
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