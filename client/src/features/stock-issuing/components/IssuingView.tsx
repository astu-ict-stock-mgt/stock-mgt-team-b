// client/src/features/stock-issuing/components/IssuingView.tsx

import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks';
import { useInventoryItems, useRequisitions, useIssueRequisition } from '../hooks';
import { RequisitionForm } from './RequisitionForm';
import { ApprovalQueue } from './ApprovalQueue';
import { Shield, Truck, Package, AlertTriangle, FileSpreadsheet, RefreshCw } from 'lucide-react';

// ============================================================
// STOREKEEPER VIEW COMPONENT
// ============================================================

const StorekeeperQueue: React.FC = () => {
  const { user } = useAuth();
  
  // Queries & Mutations
  const { data: inventory = [], isLoading: isInventoryLoading } = useInventoryItems();
  const { data: requisitions = [], isLoading: isReqsLoading, refetch, isRefetching } = useRequisitions();
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
          <h2 className="text-xl font-bold text-gray-900">Approved Requisitions (Storekeeper View)</h2>
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

      {/* SIV Generated Dialog */}
      {issuedSiv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4 border border-green-100">
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
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 font-mono text-xs space-y-2 text-gray-800">
              <div className="flex justify-between border-b border-gray-200 pb-1.5 font-bold">
                <span>VOUCHER NO:</span>
                <span className="text-green-700">{issuedSiv.sivNumber}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>REF REQ:</span>
                <span>{issuedSiv.reqNo}</span>
              </div>
              <div className="flex justify-between text-[10px] pb-1.5 border-b border-gray-150">
                <span>DATE:</span>
                <span>{new Date(issuedSiv.issuedAt).toLocaleString()}</span>
              </div>
              
              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between font-bold text-[10px] text-gray-400">
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                {issuedSiv.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[200px]">{it.name}</span>
                    <span className="font-bold">x{it.qty}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-gray-300 pt-2 text-[10px] text-center text-gray-400">
                Authorized Stock Issue - SMS Enterprise
              </div>
            </div>

            <button
              onClick={() => setIssuedSiv(null)}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Main Queue */}
      {isReqsLoading || isInventoryLoading ? (
        <div className="py-12 text-center text-gray-400">Loading approved requisitions...</div>
      ) : approvedUnissuedReqs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          <Truck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-md font-semibold text-gray-700">No Requisitions to Issue</h3>
          <p className="text-xs text-gray-400 mt-0.5">
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
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition duration-200"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-gray-800">{req.requisitionNumber}</span>
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
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Available Stock</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {checkedItems.map((item) => (
                          <tr key={item.itemId} className={!item.sufficient ? 'bg-red-50/30' : ''}>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-800">{item.quantityRequested} {item.unit}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{item.available} {item.unit}</td>
                            <td className="px-4 py-2.5 text-center">
                              {/* Acceptance Criteria #1: UI warns the user if requested quantity exceeds available stock */}
                              {item.sufficient ? (
                                <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                  ✓ In Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
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
                <div className="flex md:flex-col justify-end gap-2 md:justify-center md:border-l md:border-gray-100 md:pl-6 min-w-[170px]">
                  {containsOutofStock && (
                    <div className="text-center rounded bg-red-50 border border-red-200 p-2.5 text-[10.5px] text-red-700 mb-1 font-medium">
                      ⚠️ Stock Insufficient. Fill inventory before issuing.
                    </div>
                  )}
                  <button
                    onClick={() => handleIssue(req.id)}
                    disabled={isIssuing || containsOutofStock}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Package className="h-4 w-4" />
                    {isIssuing ? 'Issuing...' : 'Issue & Create SIV'}
                  </button>
                </div>
              </div>
            );
          })}
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
  const [simulatedRole, setSimulatedRole] = useState<'DEPARTMENT_HEAD' | 'PAO' | 'STOREKEEPER' | null>(null);

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
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-8 text-center max-w-xl mx-auto space-y-3">
            <Shield className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">Access Restricted</h3>
            <p className="text-sm text-gray-600">
              Your logged-in role (<strong className="text-gray-800">{user?.role}</strong>) does not have access permissions for the Stock Requisition & Issuing module.
            </p>
            <p className="text-xs text-gray-500">
              Only Department Heads, Property Administration Officers, or Storekeepers are authorized.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Bar for Admin */}
      {user?.role === 'ADMINISTRATOR' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Administrator Mode</p>
              <p className="text-[11px] text-blue-700">Simulate workflow roles to test the end-to-end stock issuing process.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-800 font-semibold">Active Role:</span>
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
      <div className="min-h-[500px]">
        {renderView()}
      </div>
    </div>
  );
};

export default IssuingView;
