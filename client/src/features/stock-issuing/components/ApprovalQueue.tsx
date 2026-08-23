// client/src/features/stock-issuing/components/ApprovalQueue.tsx

import React, { useState } from 'react';
import { useRequisitions, useApproveRequisition, useRejectRequisition } from '../hooks';
import { Check, X, FileCheck, RefreshCw, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { useAuth } from '../../auth/hooks';

export const ApprovalQueue: React.FC = () => {
  const { user } = useAuth();
  
  // Queries & Mutations
  const { data: requisitions = [], isLoading, refetch, isRefetching } = useRequisitions();
  const { mutate: approveReq, isPending: isApproving } = useApproveRequisition();
  const { mutate: rejectReq, isPending: isRejecting } = useRejectRequisition();

  // State
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const pendingReqs = requisitions.filter((r) => r.status === 'PENDING');
  const historyReqs = requisitions.filter((r) => r.status !== 'PENDING');

  const handleApprove = (id: string) => {
    const approverName = user ? `${user.firstName} ${user.lastName}` : 'PAO Officer';
    
    if (window.confirm('Are you sure you want to APPROVE this requisition?')) {
      approveReq(
        { id, approvedBy: approverName },
        {
          onSuccess: () => {
            alert('Requisition approved successfully.');
          },
          onError: (err) => {
            alert(`Error approving requisition: ${(err as Error).message}`);
          },
        }
      );
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingReqId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    const approverName = user ? `${user.firstName} ${user.lastName}` : 'PAO Officer';

    rejectReq(
      { id: rejectingReqId!, rejectedBy: approverName, reason: rejectionReason.trim() },
      {
        onSuccess: () => {
          alert('Requisition rejected.');
          setRejectingReqId(null);
          setRejectionReason('');
        },
        onError: (err) => {
          alert(`Error rejecting requisition: ${(err as Error).message}`);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            Approved
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            Issued
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            Rejected
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
          <h2 className="text-xl font-bold text-gray-900">Approval Queue (PAO View)</h2>
          <p className="text-sm text-gray-500">Review, authorize, or reject department requisition requests.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('pending');
            setRejectingReqId(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Approval
          {pendingReqs.length > 0 && (
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {pendingReqs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setRejectingReqId(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Decision History
        </button>
      </div>

      {/* Rejection Modal (Inline) */}
      {rejectingReqId && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 space-y-4">
          <div className="flex gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-gray-800">Reject Requisition</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Provide a reason for rejecting requisition: <strong>{requisitions.find(r => r.id === rejectingReqId)?.requisitionNumber}</strong>
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide context or explanation for rejection (e.g., Requested items are reserved for IT audit next week, department quota exceeded, etc.)"
              className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
              rows={3}
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingReqId(null)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isRejecting}
                className="rounded-md bg-red-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-red-700 transition"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Lists */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading requisitions...</div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-4">
          {pendingReqs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
              <FileCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-md font-semibold text-gray-700">Clear queue!</h3>
              <p className="text-xs text-gray-400 mt-0.5">There are no pending stock requisitions to authorize.</p>
            </div>
          ) : (
            pendingReqs.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition duration-200"
              >
                <div className="space-y-3 flex-1">
                  {/* Card Header info */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-gray-800">{req.requisitionNumber}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-semibold text-blue-600">{req.department}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Requested by <strong className="text-gray-700">{req.requesterName}</strong>
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Requested Items List */}
                  <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items Requested</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                      {req.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between border-b border-gray-100 pb-1 pr-4">
                          <span>{item.itemName}</span>
                          <span className="font-bold text-gray-900">x{item.quantityRequested}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Justification */}
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-700">Justification: </span>
                    {req.justification}
                  </div>
                </div>

                {/* Approver Actions */}
                <div className="flex md:flex-col justify-end gap-2 md:justify-center md:border-l md:border-gray-100 md:pl-6 min-w-[150px]">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={isApproving || isRejecting}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleOpenReject(req.id)}
                    disabled={isApproving || isRejecting}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Requisition Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department / Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Items Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rejection Reason / Log Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {historyReqs.slice().reverse().map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-800">{req.requisitionNumber}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-800">{req.department}</div>
                    <div className="text-xs text-gray-500">{req.requesterName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
                      {req.items.map((it, i) => (
                        <li key={i}>
                          {it.itemName} <span className="font-semibold">x{it.quantityRequested}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <div className="rounded bg-red-50 border border-red-100 p-2 text-red-800 max-w-xs">
                        <p className="font-semibold text-red-500">Rejection Reason:</p>
                        <p className="mt-0.5 font-medium">{req.rejectionReason}</p>
                      </div>
                    )}
                    {req.status === 'APPROVED' && (
                      <p>Authorized by {req.approvedBy} on {new Date(req.approvedAt!).toLocaleDateString()}</p>
                    )}
                    {req.status === 'ISSUED' && (
                      <div className="space-y-0.5">
                        <p>Authorized by {req.approvedBy}</p>
                        <p className="font-semibold text-green-700">Issued SIV: {req.sivNumber}</p>
                        <p>Issued by {req.issuedBy} on {new Date(req.issuedAt!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {historyReqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    No decision history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
