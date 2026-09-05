import React, { useState } from 'react';
import { useGatePassHistory } from '../hooks';
import type { GatePassRecord } from '../types';
import { GatePassModal } from './GatePassModal';
import {
  History,
  Search,
  CheckCircle2,
  AlertOctagon,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const ClearanceHistory: React.FC = () => {
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'OUTBOUND' | 'INBOUND'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLEARED' | 'FLAGGED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<GatePassRecord | null>(null);

  const {
    data: history,
    isLoading,
    isError,
  } = useGatePassHistory({
    direction: directionFilter === 'ALL' ? undefined : directionFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    query: search || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pass #, vehicle plate, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pr-4 pl-9 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setDirectionFilter('ALL')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                directionFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Movements
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('OUTBOUND')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                directionFilter === 'OUTBOUND'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              Outbound
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('INBOUND')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                directionFilter === 'INBOUND'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowDownLeft className="h-3 w-3" />
              Inbound
            </button>
          </div>

          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CLEARED')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'CLEARED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cleared
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FLAGGED')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'FLAGGED'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Flagged
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Pass Number</th>
                <th className="px-4 py-3 text-left">Direction</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Vehicle Plate</th>
                <th className="px-4 py-3 text-left">Carrier / Driver</th>
                <th className="px-4 py-3 text-left">Destination / Origin</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Loading clearance logs...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-red-600">
                    Failed to load clearance history.
                  </td>
                </tr>
              ) : !history || history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <History className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No gate clearance records found.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const isOutbound = record.direction === 'OUTBOUND';
                  const isCleared = record.status === 'CLEARED';

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {record.passNumber}
                      </td>
                      <td className="px-4 py-3">
                        {isOutbound ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            <ArrowUpRight className="h-3 w-3" />
                            OUTBOUND
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            <ArrowDownLeft className="h-3 w-3" />
                            INBOUND
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {record.referenceNumber}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                        {record.vehiclePlate}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{record.driverName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {record.destination || record.origin || 'Main Campus'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(record.clearedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            CLEARED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10.5px] font-bold text-red-800">
                            <AlertOctagon className="h-3 w-3" />
                            FLAGGED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPass(record)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <GatePassModal
        gatePass={selectedPass}
        isOpen={Boolean(selectedPass)}
        onClose={() => setSelectedPass(null)}
      />
    </div>
  );
};
