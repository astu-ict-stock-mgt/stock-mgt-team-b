import React, { useState } from 'react';
import {
  useWarehouses,
  useStockTakeSessions,
  useSessionWorksheet,
  useCreateSession,
  useSubmitCount,
  useCompleteSession,
} from '../hooks';
import type { WorksheetItem } from '../types';
import {
  ClipboardCheck,
  Plus,
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  Check,
  Lock,
} from 'lucide-react';

export const CountWorksheet: React.FC = () => {
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: sessions, isLoading: isLoadingSessions } = useStockTakeSessions();
  const { mutate: createSession, isPending: isCreatingSession } = useCreateSession();
  const { mutate: submitCount, isPending: isSubmittingCount } = useSubmitCount();
  const { mutate: completeSession, isPending: isCompletingSession } = useCompleteSession();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft counts per item: { [itemId]: number }
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});

  // Derive active session: explicit selection, or active/counting session, or first session
  const activeSession =
    (selectedSessionId ? sessions?.find((s) => s.id === selectedSessionId) : null) ??
    sessions?.find((s) => s.status === 'DRAFT' || s.status === 'COUNTING') ??
    sessions?.[0] ??
    null;

  const activeSessionId = activeSession?.id ?? null;

  // Fetch worksheet for active session
  const { data: worksheetData, isLoading: isLoadingWorksheet } =
    useSessionWorksheet(activeSessionId);

  const handleStartNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;

    createSession(selectedWarehouseId, {
      onSuccess: (newSession) => {
        setSelectedSessionId(newSession.id);
        setDraftCounts({});
      },
    });
  };

  const currentSession = activeSession;
  const isSessionClosed =
    currentSession?.status === 'COMPLETED' || currentSession?.status === 'CANCELLED';

  const items = worksheetData?.worksheet ?? [];
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = items.length;
  const countedItems = items.filter((i) => i.isCounted).length;
  const discrepanciesCount = items.filter((i) => i.hasDiscrepancy).length;

  const handleDraftChange = (itemId: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || parsed < 0) {
      const next = { ...draftCounts };
      delete next[itemId];
      setDraftCounts(next);
    } else {
      setDraftCounts((prev) => ({ ...prev, [itemId]: parsed }));
    }
  };

  const handleSaveItemCount = (item: WorksheetItem) => {
    if (!activeSessionId) return;
    const countVal = draftCounts[item.id] ?? item.physicalQuantity;
    if (countVal === null || countVal === undefined) return;

    submitCount(
      {
        sessionId: activeSessionId,
        inventoryItemId: item.id,
        physicalQuantity: countVal,
      },
      {
        onSuccess: () => {
          // Clear draft count after successfully recording
          setDraftCounts((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
        },
      }
    );
  };

  const handleFinalizeSession = () => {
    if (!activeSessionId) return;
    if (
      window.confirm(
        'Are you sure you want to complete this stock-take session? Any recorded discrepancies will be queued for Property Administration Officer (PAO) reconciliation review.'
      )
    ) {
      completeSession(activeSessionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Management & Warehouse Selector Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Physical Stock Count Worksheet</h2>
                <p className="text-xs text-gray-500">
                  Record actual on-hand quantities, identify bin card discrepancies, and submit for
                  reconciliation.
                </p>
              </div>
            </div>
          </div>

          {/* Session Switcher / Starter */}
          <div className="flex flex-wrap items-center gap-3">
            {sessions && sessions.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="session-select" className="text-xs font-semibold text-gray-600">
                  Session:
                </label>
                <select
                  id="session-select"
                  value={activeSessionId || ''}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setDraftCounts({});
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.warehouseName} ({s.status}) — {new Date(s.startedAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start New Session */}
            <form onSubmit={handleStartNewSession} className="flex items-center gap-2">
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="">Select Warehouse...</option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.location ? `(${w.location})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedWarehouseId || isCreatingSession}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Session</span>
              </button>
            </form>
          </div>
        </div>

        {/* Active Session Status Banner */}
        {currentSession && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-[11px] font-medium text-gray-500 uppercase">Warehouse</span>
              <p className="mt-0.5 flex items-center gap-1.5 font-bold text-gray-900">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{currentSession.warehouseName}</span>
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-[11px] font-medium text-gray-500 uppercase">Progress</span>
              <p className="mt-0.5 font-bold text-gray-900">
                {countedItems} / {totalItems} items counted
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-[11px] font-medium text-gray-500 uppercase">Discrepancies</span>
              <p
                className={`mt-0.5 font-bold ${discrepanciesCount > 0 ? 'text-amber-600' : 'text-green-600'}`}
              >
                {discrepanciesCount} items with variance
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">Status</span>
                <p className="mt-0.5 font-bold text-gray-800">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                      currentSession.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : currentSession.status === 'COUNTING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentSession.status}
                  </span>
                </p>
              </div>

              {!isSessionClosed && (
                <button
                  type="button"
                  onClick={handleFinalizeSession}
                  disabled={isCompletingSession || countedItems === 0}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                  title="Finalize counting and queue discrepancies for PAO reconciliation"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Finalize</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter items by code, name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-xs focus:border-blue-500 focus:outline-hidden"
        />
        <span className="text-xs text-gray-400">
          Showing {filteredItems.length} of {totalItems} items
        </span>
      </div>

      {/* Worksheet Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {isLoadingWorksheet || isLoadingSessions || isLoadingWarehouses ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading stock worksheet...</div>
        ) : !activeSessionId ? (
          <div className="p-12 text-center text-gray-500">
            <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No Active Stock Take Session</p>
            <p className="mt-1 text-xs text-gray-400">
              Select a warehouse above and click &quot;New Session&quot; to generate a physical
              count worksheet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-5 py-3">Item Details</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">System Balance</th>
                  <th className="px-5 py-3 text-center">Physical Count</th>
                  <th className="px-5 py-3 text-center">Discrepancy</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredItems.map((item) => {
                  const draftVal = draftCounts[item.id];
                  const effectiveCount = draftVal !== undefined ? draftVal : item.physicalQuantity;
                  const hasInput = effectiveCount !== null && effectiveCount !== undefined;
                  const calculatedDiscrepancy = hasInput
                    ? effectiveCount - item.systemQuantity
                    : null;
                  const isSaved = item.isCounted && draftVal === undefined;

                  return (
                    <tr
                      key={item.id}
                      className={item.isCounted ? 'bg-blue-50/20' : 'hover:bg-gray-50/60'}
                    >
                      {/* Item Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="font-mono text-[10px] text-blue-600">{item.itemCode}</div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 text-gray-600">{item.category}</td>

                      {/* System Balance */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                        {item.systemQuantity}
                      </td>

                      {/* Physical Count Input */}
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          disabled={isSessionClosed}
                          placeholder={
                            item.physicalQuantity !== null ? String(item.physicalQuantity) : 'Count'
                          }
                          value={draftVal !== undefined ? draftVal : (item.physicalQuantity ?? '')}
                          onChange={(e) => handleDraftChange(item.id, e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-2.5 py-1 text-center font-mono text-xs font-bold text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden disabled:bg-gray-100"
                        />
                      </td>

                      {/* Discrepancy Indicator */}
                      <td className="px-5 py-3.5 text-center">
                        {calculatedDiscrepancy !== null ? (
                          calculatedDiscrepancy === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Exact Match (0)</span>
                            </span>
                          ) : calculatedDiscrepancy > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <AlertCircle className="h-3 w-3" />
                              <span>Surplus (+{calculatedDiscrepancy})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <AlertCircle className="h-3 w-3" />
                              <span>Shortage ({calculatedDiscrepancy})</span>
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {item.isCounted ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              <Check className="h-3 w-3" />
                              <span>Recorded</span>
                            </span>
                            {item.countedBy && (
                              <span className="mt-0.5 text-[9px] text-gray-400">
                                By {item.countedBy}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            Pending Count
                          </span>
                        )}
                      </td>

                      {/* Save Action */}
                      <td className="px-5 py-3.5 text-right">
                        {!isSessionClosed && (
                          <button
                            type="button"
                            onClick={() => handleSaveItemCount(item)}
                            disabled={
                              isSubmittingCount ||
                              (draftVal === undefined && item.physicalQuantity === null) ||
                              isSaved
                            }
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition ${
                              draftVal !== undefined
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>
                              {draftVal !== undefined ? 'Save' : isSaved ? 'Saved' : 'Save'}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                      No matching items found for this warehouse.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountWorksheet;
