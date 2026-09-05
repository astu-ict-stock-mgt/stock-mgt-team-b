// client/src/features/stock-issuing/components/IssuingView.tsx

import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks';
import { useInventoryItems, useRequisitions, useIssueRequisition, useIssueHistory } from '../hooks';
import { RequisitionForm } from './RequisitionForm';
import { ApprovalQueue } from './ApprovalQueue';
import { Shield, Truck, Package, AlertTriangle, FileSpreadsheet, RefreshCw } from 'lucide-react';

// ============================================================
// STOREKEEPER VIEW COMPONENT
// ============================================================

const StorekeeperQueue: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // Queries & Mutations
  const { data: inventory = [], isLoading: isInventoryLoading } = useInventoryItems();
  const {
    data: requisitions = [],
    isLoading: isReqsLoading,
    refetch,
    isRefetching,
  } = useRequisitions();
  const { data: issueHistory = [], isLoading: isHistoryLoading } = useIssueHistory();
  const { mutate: issueReq, isPending: isIssuing } = useIssueRequisition();

  // State for success modal after issuing
  const [issuedSiv, setIssuedSiv] = useState<{
    reqNo: string;
    sivNumber: string;
    items: { name: string; qty: number }[];
    issuedAt: string;
  } | null>(null);

  // Filter for approved and unissued requisitions (AC #3)
  const approvedUnissuedReqs = requisitions.filter((r) => r.status === 'APPROVED');

  const checkItemAvailability = (itemId: string, requestedQty: number) => {
    const item = inventory.find((inv) => inv.id === itemId);
    if (!item) return { available: 0, sufficient: false, name: 'Unknown' };
    return {
      available: item.quantity,
      sufficient: item.quantity >= requestedQty,
      name: item.name,
      unit: item.unit,
    };
  };

  const handleIssue = (reqId: string) => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return;

    // Double check stock availability before attempting issue
    const hasInsufficientStock = req.items.some((item) => {
      const stock = checkItemAvailability(item.itemId, item.quantityRequested);
      return !stock.sufficient;
    });

    if (hasInsufficientStock) {
      alert('Cannot issue this requisition. One or more items exceed available stock levels.');
      return;
    }

    const storekeeperName = user ? `${user.firstName} ${user.lastName}` : 'Storekeeper';

    issueReq(
      { id: reqId, issuedBy: storekeeperName },
      {
        onSuccess: (updatedReq) => {
          // Open SIV Success Voucher
          setIssuedSiv({
            reqNo: updatedReq.requisitionNumber,
            sivNumber: updatedReq.sivNumber || 'SIV-MOCK-NUM',
            items: updatedReq.items.map((it) => ({ name: it.itemName, qty: it.quantityRequested })),
            issuedAt: updatedReq.issuedAt || new Date().toISOString(),
          });
        },
        onError: (err) => {
          alert(`Failed to issue stock: ${(err as Error).message}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Approved Requisitions (Storekeeper View)
          </h2>
          <p className="text-sm text-gray-500">
            Check availability, generate Stock Issue Vouchers (SIV), and release items.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isReqsLoading || isRefetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'queue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="h-4 w-4" />
          Pending Issue Queue ({approvedUnissuedReqs.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Issued History / SIVs ({issueHistory.length})
        </button>
      </div>

      {/* SIV Generated Dialog */}
      {issuedSiv && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-green-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-md font-bold text-gray-900">SIV Generated Successfully!</h3>
                <p className="text-xs text-gray-500">Stock Issue Voucher created in database.</p>
              </div>
            </div>

            {/* Voucher Bill */}
            <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4 font-mono text-xs text-gray-800">
              <div className="flex justify-between border-b border-gray-200 pb-1.5 font-bold">
                <span>VOUCHER NO:</span>
                <span className="text-green-700">{issuedSiv.sivNumber}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>REF REQ:</span>
                <span>{issuedSiv.reqNo}</span>
              </div>
              <div className="border-gray-150 flex justify-between border-b pb-1.5 text-[10px]">
                <span>DATE:</span>
                <span>{new Date(issuedSiv.issuedAt).toLocaleString()}</span>
              </div>

              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                {issuedSiv.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="max-w-[200px] truncate">{it.name}</span>
                    <span className="font-bold">x{it.qty}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 text-center text-[10px] text-gray-400">
                Authorized Stock Issue - SMS Enterprise
              </div>
            </div>

            <button
              onClick={() => setIssuedSiv(null)}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-700"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Queue or History */}
      {activeTab === 'queue' ? (
        isReqsLoading || isInventoryLoading ? (
          <div className="py-12 text-center text-gray-400">Loading approved requisitions...</div>
        ) : approvedUnissuedReqs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            <Truck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="text-md font-semibold text-gray-700">No Requisitions to Issue</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Approved requisitions awaiting dispatch will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedUnissuedReqs.map((req) => {
              // Check if any item in this request exceeds available inventory
              let containsOutofStock = false;

              const checkedItems = req.items.map((item) => {
                const stock = checkItemAvailability(item.itemId, item.quantityRequested);
                if (!stock.sufficient) containsOutofStock = true;
                return {
                  ...item,
                  available: stock.available,
                  sufficient: stock.sufficient,
                  unit: stock.unit,
                };
              });

              return (
                <div
                  key={req.id}
                  className="flex flex-col justify-between gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md md:flex-row"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold text-gray-800">
                        {req.requisitionNumber}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm font-semibold text-blue-600">{req.department}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Approved by <strong className="text-gray-700">{req.approvedBy}</strong>
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Items List with Availability Warning Indicators */}
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold tracking-wider text-gray-500 uppercase">
                              Item Name
                            </th>
                            <th className="px-4 py-2 text-right font-semibold tracking-wider text-gray-500 uppercase">
                              Requested
                            </th>
                            <th className="px-4 py-2 text-right font-semibold tracking-wider text-gray-500 uppercase">
                              Available Stock
                            </th>
                            <th className="px-4 py-2 text-center font-semibold tracking-wider text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {checkedItems.map((item) => (
                            <tr
                              key={item.itemId}
                              className={!item.sufficient ? 'bg-red-50/30' : ''}
                            >
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {item.itemName}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                                {item.quantityRequested} {item.unit}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-600">
                                {item.available} {item.unit}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {/* Acceptance Criteria #1: UI warns the user if requested quantity exceeds available stock */}
                                {item.sufficient ? (
                                  <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                    ✓ In Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex animate-pulse items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                    <AlertTriangle className="h-3 w-3 text-red-600" /> Out of Stock
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-700">Purpose: </span>
                      {req.justification}
                    </div>
                  </div>

                  {/* Issue SIV Action */}
                  <div className="flex min-w-[170px] justify-end gap-2 md:flex-col md:justify-center md:border-l md:border-gray-100 md:pl-6">
                    {containsOutofStock && (
                      <div className="mb-1 rounded border border-red-200 bg-red-50 p-2.5 text-center text-[10.5px] font-medium text-red-700">
                        ⚠️ Stock Insufficient. Fill inventory before issuing.
                      </div>
                    )}
                    <button
                      onClick={() => handleIssue(req.id)}
                      disabled={isIssuing || containsOutofStock}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Package className="h-4 w-4" />
                      {isIssuing ? 'Issuing...' : 'Issue & Create SIV'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : /* Issued History / SIVs */
      isHistoryLoading ? (
        <div className="py-12 text-center text-gray-400">Loading issue history...</div>
      ) : issueHistory.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          <FileSpreadsheet className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-md font-semibold text-gray-700">No Stock Issue Vouchers Yet</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            When stock is issued, the generated SIV vouchers will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                    SIV Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                    Issued By
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {issueHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {item.sivNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(item.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.item}</div>
                      <div className="text-[10px] text-gray-400">{item.itemCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{item.issuedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN PAGE VIEW WRAPPER WITH ROLE ROUTING & SIMULATION
// ============================================================

export const IssuingView: React.FC = () => {
  const { user } = useAuth();

  // Simulation Active Role State (For ADMINISTRATOR only)
  const [simulatedRole, setSimulatedRole] = useState<
    'DEPARTMENT_HEAD' | 'PAO' | 'STOREKEEPER' | null
  >(null);

  const activeRole = simulatedRole || user?.role || 'DEPARTMENT_HEAD';

  // Render appropriate view based on active role
  const renderView = () => {
    switch (activeRole) {
      case 'DEPARTMENT_HEAD':
        return <RequisitionForm />;
      case 'PAO':
      case 'PROPERTY_ADMINISTRATION_OFFICER':
        return <ApprovalQueue />;
      case 'STOREKEEPER':
        return <StorekeeperQueue />;
      default:
        // Fallback for unauthorized roles
        return (
          <div className="mx-auto max-w-xl space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="text-lg font-bold text-gray-800">Access Restricted</h3>
            <p className="text-sm text-gray-600">
              Your logged-in role (<strong className="text-gray-800">{user?.role}</strong>) does not
              have access permissions for the Stock Requisition & Issuing module.
            </p>
            <p className="text-xs text-gray-500">
              Only Department Heads, Property Administration Officers, or Storekeepers are
              authorized.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Bar for Admin */}
      {user?.role === 'ADMINISTRATOR' && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold tracking-wider text-blue-800 uppercase">
                Administrator Mode
              </p>
              <p className="text-[11px] text-blue-700">
                Simulate workflow roles to test the end-to-end stock issuing process.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-800">Active Role:</span>
            <div className="inline-flex rounded-lg border border-blue-200 bg-white p-1">
              <button
                onClick={() => setSimulatedRole('DEPARTMENT_HEAD')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeRole === 'DEPARTMENT_HEAD'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                1. Dept Head
              </button>
              <button
                onClick={() => setSimulatedRole('PAO')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeRole === 'PAO'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                2. PAO
              </button>
              <button
                onClick={() => setSimulatedRole('STOREKEEPER')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeRole === 'STOREKEEPER'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                3. Storekeeper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Page Container */}
      <div className="min-h-[500px]">{renderView()}</div>
    </div>
  );
};

export default IssuingView;
