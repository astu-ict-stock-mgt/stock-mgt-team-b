import React from 'react';
import type { GatePassRecord } from '../types';
import { Printer, X, ShieldCheck, CheckCircle2, AlertOctagon, Building2 } from 'lucide-react';

interface GatePassModalProps {
  gatePass: GatePassRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({ gatePass, isOpen, onClose }) => {
  if (!isOpen || !gatePass) return null;

  const handlePrint = () => {
    window.print();
  };

  const isOutbound = gatePass.direction === 'OUTBOUND';
  const isCleared = gatePass.status === 'CLEARED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Action Header (hidden during print) */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Official Gate Pass Document</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print Pass
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="overflow-y-auto p-8 print:p-0">
          {/* Institutional Header */}
          <div className="border-b-2 border-gray-800 pb-5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
              <Building2 className="h-4 w-4" />
              ASTU ICT INVENTORY & PROPERTY ADMINISTRATION
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950 uppercase">
              {isOutbound ? 'Property Exit Gate Pass' : 'Premises Entrance Clearance'}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-600">
              Form Compliant with MoFED Property Control & Security Regulations
            </p>
          </div>

          {/* Pass Identifiers & Status Stamp */}
          <div className="my-6 grid grid-cols-2 items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Gate Pass No
              </span>
              <p className="font-mono text-base font-bold text-blue-700">{gatePass.passNumber}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                {gatePass.referenceType} Reference
              </span>
              <p className="font-mono text-sm font-bold text-gray-900">
                {gatePass.referenceNumber}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Clearance Status
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {isCleared ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    CLEARED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                    <AlertOctagon className="h-3.5 w-3.5" />
                    FLAGGED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Transport & Carrier Details */}
          <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-gray-500">Vehicle License Plate:</span>
              <p className="font-mono text-sm font-bold text-gray-900">{gatePass.vehiclePlate}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">Carrier / Driver Name:</span>
              <p className="text-sm font-bold text-gray-900">{gatePass.driverName}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">Origin Facility / Store:</span>
              <p className="text-sm font-semibold text-gray-800">
                {gatePass.origin || 'Central Warehouse'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">Authorized Destination:</span>
              <p className="text-sm font-semibold text-blue-700">
                {gatePass.destination || 'Organization Department'}
              </p>
            </div>
          </div>

          {/* Manifest of Cleared Materials */}
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
              Authorized Items Manifest ({gatePass.items.length || gatePass.itemsCount} Items)
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full min-w-[800px] divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold">#</th>
                    <th className="px-4 py-2.5 text-left font-bold">Item Code</th>
                    <th className="px-4 py-2.5 text-left font-bold">Description</th>
                    <th className="px-4 py-2.5 text-right font-bold">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {gatePass.items && gatePass.items.length > 0 ? (
                    gatePass.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 font-mono font-bold text-gray-700">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">
                          {item.quantity} {item.unit || 'pcs'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500 italic">
                        {gatePass.itemsCount} items authorized under voucher{' '}
                        {gatePass.referenceNumber}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks or Reason */}
          {gatePass.remarks && (
            <div className="mb-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
              <span className="font-semibold text-gray-900">Security Remarks: </span>
              {gatePass.remarks}
            </div>
          )}

          {gatePass.reason && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <span className="font-semibold">Reason for Discrepancy / Hold: </span>
              {gatePass.reason}
            </div>
          )}

          {/* Signature and Verification Footer */}
          <div className="mt-8 grid grid-cols-2 gap-8 border-t border-gray-300 pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">
                  Inspected & Cleared By:
                </p>
                <p className="text-sm font-bold text-gray-900">{gatePass.officer.name}</p>
                <p className="text-xs text-gray-500">Security Officer ({gatePass.officer.email})</p>
              </div>
              <div className="h-12 w-36 border-b border-dashed border-gray-400" />
              <p className="text-[10px] text-gray-400">Security Post Verification Signature</p>
            </div>

            <div className="space-y-4 text-right">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">
                  Exit / Entry Timestamp:
                </p>
                <p className="font-mono text-sm font-bold text-gray-900">
                  {new Date(gatePass.clearedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Main Campus Security Gate #1</p>
              </div>
              <div className="flex justify-end">
                <div className="flex h-16 w-32 items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-50 text-[11px] font-black tracking-wider text-emerald-800 uppercase shadow-inner">
                  OFFICIAL GATE CLEARANCE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3 print:hidden">
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-100"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
