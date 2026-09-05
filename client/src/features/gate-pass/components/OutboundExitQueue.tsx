import React, { useState } from 'react';
import { usePendingOutbound, useClearOutbound, useFlagDiscrepancy } from '../hooks';
import type { PendingOutboundDispatch, GatePassRecord } from '../types';
import { GatePassModal } from './GatePassModal';
import {
  ShieldCheck,
  Truck,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Search,
  Check,
} from 'lucide-react';

export const OutboundExitQueue: React.FC = () => {
  const { data: dispatches, isLoading, isError } = usePendingOutbound();
  const { mutate: clearOutbound, isPending: isClearing } = useClearOutbound();
  const { mutate: flagDiscrepancy, isPending: isFlagging } = useFlagDiscrepancy();

  const [search, setSearch] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<PendingOutboundDispatch | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [viewPass, setViewPass] = useState<GatePassRecord | null>(null);

  // Clearance Form State
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [destination, setDestination] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sealIntact, setSealIntact] = useState(true);

  // Flag Form State
  const [flagReason, setFlagReason] = useState('');

  const openClearModal = (dispatch: PendingOutboundDispatch) => {
    setSelectedDispatch(dispatch);
    setDestination(dispatch.departmentOrDestination);
    setVehiclePlate(dispatch.vehiclePlate || '');
    setDriverName(dispatch.driverName || '');
    setRemarks('');
    setSealIntact(true);
    setClearModalOpen(true);
  };

  const openFlagModal = (dispatch: PendingOutboundDispatch) => {
    setSelectedDispatch(dispatch);
    setVehiclePlate(dispatch.vehiclePlate || '');
    setDriverName(dispatch.driverName || '');
    setFlagReason('');
    setFlagModalOpen(true);
  };

  const handleClearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch || !vehiclePlate || !driverName) return;

    clearOutbound(
      {
        referenceNumber: selectedDispatch.referenceNumber,
        referenceType: selectedDispatch.referenceType,
        vehiclePlate,
        driverName,
        destination,
        remarks,
        sealIntact,
      },
      {
        onSuccess: (record) => {
          setClearModalOpen(false);
          setViewPass(record);
        },
      }
    );
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch || !flagReason) return;

    flagDiscrepancy(
      {
        referenceNumber: selectedDispatch.referenceNumber,
        referenceType: selectedDispatch.referenceType,
        reason: flagReason,
        vehiclePlate,
        driverName,
      },
      {
        onSuccess: (record) => {
          setFlagModalOpen(false);
          setViewPass(record);
        },
      }
    );
  };

  const filteredDispatches = (dispatches || []).filter((d) => {
    const q = search.toLowerCase();
    return (
      d.referenceNumber.toLowerCase().includes(q) ||
      d.departmentOrDestination.toLowerCase().includes(q) ||
      d.issuedBy.toLowerCase().includes(q) ||
      d.items.some((i) => i.name.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SIV number, department, item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pr-4 pl-9 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Truck className="h-4 w-4 text-blue-600" />
          <span>
            <strong>{filteredDispatches.length}</strong> dispatches in outbound queue
          </span>
        </div>
      </div>

      {/* Dispatches List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-gray-500">
          Loading outbound dispatches awaiting gate clearance...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
          Failed to load outbound gate queue. Please try again.
        </div>
      ) : filteredDispatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">No Dispatches Awaiting Clearance</h3>
          <p className="mt-1 text-xs text-gray-500">
            When the storekeeper issues stock against approved requisitions, they appear here for
            gate exit inspection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredDispatches.map((dispatch) => {
            const isCleared = dispatch.status === 'CLEARED';
            const isFlagged = dispatch.status === 'FLAGGED';

            return (
              <div
                key={dispatch.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Card Header */}
                <div className="border-b border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-700">
                        {dispatch.referenceNumber}
                      </span>
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {dispatch.referenceType}
                      </span>
                    </div>

                    <div>
                      {isCleared ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          EXIT CLEARED
                        </span>
                      ) : isFlagged ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                          <AlertOctagon className="h-3 w-3" />
                          FLAGGED / HELD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          READY FOR EXIT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <div>
                      Destination:{' '}
                      <strong className="text-gray-800">{dispatch.departmentOrDestination}</strong>
                    </div>
                    <div>
                      Store: <span className="text-gray-700">{dispatch.warehouseName}</span>
                    </div>
                    <div>
                      Issued: {new Date(dispatch.issuedAt).toLocaleDateString()} by{' '}
                      <span className="text-gray-700">{dispatch.issuedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Items Manifest */}
                <div className="flex-1 p-4">
                  <div className="mb-2 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                    Authorized Items ({dispatch.itemsCount})
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-2 text-xs">
                    <ul className="divide-y divide-gray-100">
                      {dispatch.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between py-1 text-[11px]"
                        >
                          <div>
                            <span className="font-mono text-gray-500">{item.itemCode}</span> —{' '}
                            <span className="font-medium text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {item.quantity} {item.unit || 'units'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {dispatch.gatePassNumber && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                      <span>
                        Gate Pass: <strong>{dispatch.gatePassNumber}</strong>
                      </span>
                      <span>
                        Plate: <strong>{dispatch.vehiclePlate}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 bg-gray-50/40 p-4">
                  <div className="flex items-center justify-end gap-2">
                    {isCleared && dispatch.gatePassNumber ? (
                      <button
                        type="button"
                        onClick={() =>
                          setViewPass({
                            id: dispatch.id,
                            passNumber: dispatch.gatePassNumber!,
                            direction: 'OUTBOUND',
                            referenceType: dispatch.referenceType,
                            referenceNumber: dispatch.referenceNumber,
                            vehiclePlate: dispatch.vehiclePlate || 'N/A',
                            driverName: dispatch.driverName || 'N/A',
                            destination: dispatch.departmentOrDestination,
                            origin: dispatch.warehouseName,
                            status: 'CLEARED',
                            itemsCount: dispatch.itemsCount,
                            items: dispatch.items,
                            officer: { id: '', name: 'Security Officer', email: '' },
                            clearedAt: dispatch.clearedAt || new Date().toISOString(),
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        View Gate Pass
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openFlagModal(dispatch)}
                          disabled={isFlagging}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <AlertOctagon className="h-3.5 w-3.5" />
                          Flag / Hold
                        </button>

                        <button
                          type="button"
                          onClick={() => openClearModal(dispatch)}
                          disabled={isClearing}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Inspect & Clear Exit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Exit Modal */}
      {clearModalOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Record Gate Exit Clearance</h3>
              </div>
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClearSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Voucher Reference:</span>
                  <strong className="font-mono text-blue-700">
                    {selectedDispatch.referenceNumber}
                  </strong>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-500">Authorized Destination:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedDispatch.departmentOrDestination}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-500">Items to Depart:</span>
                  <span className="font-bold text-gray-900">
                    {selectedDispatch.itemsCount} line items
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Vehicle License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-A-12345 or Transporter Plate"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs uppercase shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Carrier / Driver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name of driver or departmental recipient"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Destination / Delivery Point
                </label>
                <input
                  type="text"
                  required
                  placeholder="Campus location or department site"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sealIntact"
                  checked={sealIntact}
                  onChange={(e) => setSealIntact(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sealIntact" className="text-xs font-medium text-gray-700">
                  Physical count and vehicle security seal verified against voucher
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Security Officer Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, serial number verifications, or remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setClearModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClearing || !vehiclePlate || !driverName}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {isClearing ? 'Clearing...' : 'Approve & Issue Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag / Hold Modal */}
      {flagModalOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-red-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Flag & Hold Material Departure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFlagModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFlagSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                Holding material prevents departure through the security gate and notifies
                storekeepers and property administration of an unauthorized discrepancy.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Reason for Hold / Discrepancy <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe quantity mismatch, missing signature, damaged item, etc..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs shadow-xs focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Vehicle Plate</label>
                  <input
                    type="text"
                    placeholder="Vehicle plate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs uppercase shadow-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Driver name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs shadow-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setFlagModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFlagging || !flagReason}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
                >
                  <AlertOctagon className="h-4 w-4" />
                  {isFlagging ? 'Flagging...' : 'Confirm Gate Hold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Gate Pass Modal */}
      <GatePassModal
        gatePass={viewPass}
        isOpen={Boolean(viewPass)}
        onClose={() => setViewPass(null)}
      />
    </div>
  );
};
