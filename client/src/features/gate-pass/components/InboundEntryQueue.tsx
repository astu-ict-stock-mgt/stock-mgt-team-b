import React, { useState } from 'react';
import { usePendingInbound, useClearInbound, useFlagDiscrepancy } from '../hooks';
import type { PendingInboundDelivery, GatePassRecord } from '../types';
import { GatePassModal } from './GatePassModal';
import {
  ShieldCheck,
  PackageCheck,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Search,
  Check,
} from 'lucide-react';

export const InboundEntryQueue: React.FC = () => {
  const { data: deliveries, isLoading, isError } = usePendingInbound();
  const { mutate: clearInbound, isPending: isClearing } = useClearInbound();
  const { mutate: flagDiscrepancy, isPending: isFlagging } = useFlagDiscrepancy();

  const [search, setSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<PendingInboundDelivery | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [viewPass, setViewPass] = useState<GatePassRecord | null>(null);

  // Clearance Form State
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sealIntact, setSealIntact] = useState(true);

  // Flag Form State
  const [flagReason, setFlagReason] = useState('');

  const openClearModal = (delivery: PendingInboundDelivery) => {
    setSelectedDelivery(delivery);
    setSupplierName(delivery.supplierName);
    setVehiclePlate(delivery.vehiclePlate || '');
    setDriverName(delivery.driverName || '');
    setRemarks('');
    setSealIntact(true);
    setClearModalOpen(true);
  };

  const openFlagModal = (delivery: PendingInboundDelivery) => {
    setSelectedDelivery(delivery);
    setVehiclePlate(delivery.vehiclePlate || '');
    setDriverName(delivery.driverName || '');
    setFlagReason('');
    setFlagModalOpen(true);
  };

  const handleClearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !vehiclePlate || !driverName) return;

    clearInbound(
      {
        referenceNumber: selectedDelivery.grnNumber,
        supplierName,
        vehiclePlate,
        driverName,
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
    if (!selectedDelivery || !flagReason) return;

    flagDiscrepancy(
      {
        referenceNumber: selectedDelivery.grnNumber,
        referenceType: 'GRN',
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

  const filteredDeliveries = (deliveries || []).filter((d) => {
    const q = search.toLowerCase();
    return (
      d.grnNumber.toLowerCase().includes(q) ||
      d.supplierName.toLowerCase().includes(q) ||
      d.warehouseName.toLowerCase().includes(q) ||
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
            placeholder="Search GRN number, supplier name, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pr-4 pl-9 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <PackageCheck className="h-4 w-4 text-emerald-600" />
          <span>
            <strong>{filteredDeliveries.length}</strong> incoming supplier deliveries
          </span>
        </div>
      </div>

      {/* Deliveries Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-gray-500">
          Loading incoming shipments awaiting gate entry inspection...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
          Failed to load inbound delivery queue.
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <PackageCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">No Inbound Deliveries Logged</h3>
          <p className="mt-1 text-xs text-gray-500">
            Incoming supplier shipments recorded by receiving staff will appear here for entrance
            clearance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredDeliveries.map((delivery) => {
            const isCleared = delivery.status === 'CLEARED';
            const isFlagged = delivery.status === 'FLAGGED';

            return (
              <div
                key={delivery.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Header */}
                <div className="border-b border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {delivery.grnNumber}
                      </span>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        GRN
                      </span>
                    </div>

                    <div>
                      {isCleared ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          ENTRY CLEARED
                        </span>
                      ) : isFlagged ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                          <AlertOctagon className="h-3 w-3" />
                          FLAGGED / HELD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                          AWAITING GATE ENTRY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <div>
                      Supplier: <strong className="text-gray-800">{delivery.supplierName}</strong>
                    </div>
                    <div>
                      Destination: <span className="text-gray-700">{delivery.warehouseName}</span>
                    </div>
                    <div>Date: {new Date(delivery.receivedDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 p-4">
                  <div className="mb-2 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                    Delivery Manifest ({delivery.itemsCount})
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-2 text-xs">
                    <ul className="divide-y divide-gray-100">
                      {delivery.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between py-1 text-[11px]"
                        >
                          <div>
                            <span className="font-mono text-gray-500">{item.itemCode}</span> —{' '}
                            <span className="font-medium text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-900">{item.quantity} units</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {delivery.gatePassNumber && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                      <span>
                        Pass: <strong>{delivery.gatePassNumber}</strong>
                      </span>
                      <span>
                        Plate: <strong>{delivery.vehiclePlate}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 bg-gray-50/40 p-4">
                  <div className="flex items-center justify-end gap-2">
                    {isCleared && delivery.gatePassNumber ? (
                      <button
                        type="button"
                        onClick={() =>
                          setViewPass({
                            id: delivery.id,
                            passNumber: delivery.gatePassNumber!,
                            direction: 'INBOUND',
                            referenceType: 'GRN',
                            referenceNumber: delivery.grnNumber,
                            vehiclePlate: delivery.vehiclePlate || 'N/A',
                            driverName: delivery.driverName || 'N/A',
                            destination: delivery.warehouseName,
                            origin: delivery.supplierName,
                            status: 'CLEARED',
                            itemsCount: delivery.itemsCount,
                            items: delivery.items,
                            officer: { id: '', name: 'Security Officer', email: '' },
                            clearedAt: delivery.clearedAt || new Date().toISOString(),
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        View Entrance Pass
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openFlagModal(delivery)}
                          disabled={isFlagging}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <AlertOctagon className="h-3.5 w-3.5" />
                          Hold Delivery
                        </button>

                        <button
                          type="button"
                          onClick={() => openClearModal(delivery)}
                          disabled={isClearing}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Log Gate Entrance
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

      {/* Clear Modal */}
      {clearModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Authorize Supplier Gate Entrance
                </h3>
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
                  <span className="text-gray-500">GRN Reference:</span>
                  <strong className="font-mono text-emerald-700">
                    {selectedDelivery.grnNumber}
                  </strong>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedDelivery.supplierName}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Delivery Vehicle License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-B-67890"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs uppercase shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Driver / Transporter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name of delivery driver"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sealIntactInbound"
                  checked={sealIntact}
                  onChange={(e) => setSealIntact(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sealIntactInbound" className="text-xs font-medium text-gray-700">
                  Supplier seals, cargo integrity, and delivery documents verified at gate
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Gate Security Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, container conditions, or remarks..."
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {isClearing ? 'Recording...' : 'Authorize Entrance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-red-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Hold Incoming Supplier Delivery
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
                Holding incoming deliveries alerts warehouse storekeepers of broken seals, damaged
                containers, or missing commercial invoices.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Reason for Entrance Hold <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe broken container seal, damaged packaging, missing paperwork..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs shadow-xs focus:border-red-500 focus:outline-hidden"
                />
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
                  {isFlagging ? 'Holding...' : 'Confirm Delivery Hold'}
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
