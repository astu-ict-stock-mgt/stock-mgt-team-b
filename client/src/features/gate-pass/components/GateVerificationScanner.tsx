import React, { useState } from 'react';
import { useVerifyReference } from '../hooks';
import { Search, ShieldCheck, AlertOctagon, CheckCircle2, QrCode } from 'lucide-react';

export const GateVerificationScanner: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const { data: result, isLoading, isFetching } = useVerifyReference(activeQuery, true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setActiveQuery(searchTerm.trim());
  };

  const handleQuickLookup = (sample: string) => {
    setSearchTerm(sample);
    setActiveQuery(sample);
  };

  return (
    <div className="space-y-6">
      {/* Scanner / Lookup Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">
              Quick Gate Verification & Barcode Scanner
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Scan or type any Store Issue Voucher (e.g. SIV-2026-0001), Gate Pass (e.g.
            GP-2026-0001), or Goods Receiving Note (GRN-2026-0001) to verify exit authorization in
            real-time.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Enter SIV number, Gate Pass #, or GRN #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pr-4 pl-10 font-mono text-xs uppercase shadow-xs focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || isFetching || !searchTerm.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {isLoading || isFetching ? 'Verifying...' : 'Verify Authorization'}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="text-[11px] font-semibold text-gray-400">Quick Test Examples:</span>
          <button
            type="button"
            onClick={() => handleQuickLookup('SIV-2026-0001')}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-blue-700 hover:bg-gray-100"
          >
            SIV-2026-0001
          </button>
          <button
            type="button"
            onClick={() => handleQuickLookup('GP-2026-0001')}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-emerald-700 hover:bg-gray-100"
          >
            GP-2026-0001
          </button>
          <button
            type="button"
            onClick={() => handleQuickLookup('GRN-2026-0001')}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-purple-700 hover:bg-gray-100"
          >
            GRN-2026-0001
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {isFetching ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
          Verifying security authorization with database...
        </div>
      ) : result ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Status Banner */}
          {result.authorized ? (
            <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-4">
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  {result.verificationType === 'GATE_PASS_MATCH'
                    ? 'OFFICIAL GATE PASS VERIFIED — MATERIAL CLEARED'
                    : 'AUTHORIZED STORE ISSUE VOUCHER (SIV) — READY FOR GATE CLEARANCE'}
                </h3>
                <p className="text-xs text-emerald-800">
                  {result.verificationType === 'GATE_PASS_MATCH'
                    ? 'This movement has been officially inspected, stamped, and logged by premises security.'
                    : 'The goods have been approved and issued by the storekeeper. Complete physical check and record vehicle plate to clear exit.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-6 py-4">
              <AlertOctagon className="h-7 w-7 shrink-0 text-red-600" />
              <div>
                <h3 className="text-base font-bold text-red-950">
                  UNAUTHORIZED MOVEMENT / NOT CLEARED
                </h3>
                <p className="text-xs text-red-800">
                  {result.message ||
                    'Security Warning: This reference does not have valid exit clearance or approved store issue voucher. DO NOT PERMIT DEPARTURE.'}
                </p>
              </div>
            </div>
          )}

          {/* Detailed Verification Manifest */}
          <div className="p-6">
            {/* If Gate Pass Match */}
            {result.gatePass && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Pass Number
                    </span>
                    <p className="font-mono text-sm font-bold text-blue-700">
                      {result.gatePass.passNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Vehicle Plate
                    </span>
                    <p className="font-mono text-sm font-bold text-gray-900">
                      {result.gatePass.vehiclePlate}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Carrier Name
                    </span>
                    <p className="text-sm font-bold text-gray-900">{result.gatePass.driverName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Exit Timestamp
                    </span>
                    <p className="text-xs font-semibold text-gray-800">
                      {new Date(result.gatePass.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {result.gatePass.items && result.gatePass.items.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
                      Cleared Material Manifest ({result.gatePass.items.length} Items)
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Item Code</th>
                            <th className="px-4 py-2 text-left font-semibold">Description</th>
                            <th className="px-4 py-2 text-right font-semibold">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {result.gatePass.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-mono font-bold text-gray-700">
                                {item.itemCode}
                              </td>
                              <td className="px-4 py-2 text-gray-900">{item.name}</td>
                              <td className="px-4 py-2 text-right font-bold text-gray-900">
                                {item.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If SIV Requisition Document */}
            {result.document && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      SIV Reference
                    </span>
                    <p className="font-mono text-sm font-bold text-blue-700">
                      {result.document.sivNumber || result.document.requisitionNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Department
                    </span>
                    <p className="text-sm font-bold text-gray-900">{result.document.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Issued By Storekeeper
                    </span>
                    <p className="text-sm font-bold text-gray-900">
                      {result.document.issuer || 'Authorized Storekeeper'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                      Issue Date
                    </span>
                    <p className="text-xs font-semibold text-gray-800">
                      {result.document.issuedAt
                        ? new Date(result.document.issuedAt).toLocaleDateString()
                        : 'Today'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
                    Authorized Items Under This SIV ({result.document.items?.length || 0})
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Item Code</th>
                          <th className="px-4 py-2 text-left font-semibold">Description</th>
                          <th className="px-4 py-2 text-left font-semibold">Origin Store</th>
                          <th className="px-4 py-2 text-right font-semibold">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {result.document.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-mono font-bold text-gray-700">
                              {item.itemCode}
                            </td>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {item.warehouse || 'Central Store'}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-gray-900">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
