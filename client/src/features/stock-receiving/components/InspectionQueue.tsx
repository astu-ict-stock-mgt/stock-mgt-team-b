/**
 * InspectionQueue.tsx
 * SRS Reference: 4.4.10 - Technical Inspection of received goods
 * Workflow Stage 3: Stock Clerk enters accepted/damaged quantities per item
 */
import { useState } from 'react';
import { Microscope, CheckCircle2, ClipboardList, Package, Loader2 } from 'lucide-react';
import { useGrnList, useSubmitInspection } from '../hooks';
import type { GrnSummary, InspectionItemResult } from '../api';
import { fetchGrn, type Grn } from '../api';

// ── Status badge helper ──────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT:                  { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    PENDING_INSPECTION:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Inspection' },
    INSPECTED:              { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Inspected' },
    PENDING_PAO_APPROVAL:   { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Awaiting PAO Approval' },
    APPROVED:               { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    REJECTED:               { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ── Inspection form for one GRN ──────────────────────────────────────────────

interface InspectionFormProps {
  grn: Grn;
  onDone: () => void;
}

function InspectionForm({ grn, onDone }: InspectionFormProps) {
  const { mutate: submitInspection, isPending } = useSubmitInspection();
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [results, setResults] = useState<InspectionItemResult[]>(
    grn.lineItems.map((li) => ({
      itemId: li.id,
      acceptedQty: li.quantity,
      damagedQty: 0,
      inspectorRemarks: '',
    }))
  );
  const [error, setError] = useState<string | null>(null);

  const updateResult = (idx: number, patch: Partial<InspectionItemResult>) => {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate totals
    for (let i = 0; i < results.length; i++) {
      const item = grn.lineItems[i];
      const r = results[i];
      if (r.acceptedQty + r.damagedQty > item.quantity) {
        setError(`${item.itemName}: accepted + damaged (${r.acceptedQty + r.damagedQty}) exceeds received qty (${item.quantity}).`);
        return;
      }
    }

    submitInspection(
      { id: grn.id, items: results, inspectorNotes: inspectorNotes.trim() || undefined },
      {
        onSuccess: () => onDone(),
        onError: (err) => setError((err as Error).message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* GRN Header Info */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="font-medium text-blue-800">GRN:</span> <span className="font-mono text-blue-700">{grn.grnNumber}</span></div>
          <div><span className="font-medium text-blue-800">Supplier:</span> {grn.supplierName}</div>
          <div><span className="font-medium text-blue-800">Target Warehouse:</span> {grn.warehouseName}</div>
          <div><span className="font-medium text-blue-800">Received:</span> {new Date(grn.receivedDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Per-item inspection inputs */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Item Quality Inspection
        </h4>
        {grn.lineItems.map((li, idx) => {
          const r = results[idx];
          const totalEntered = (r?.acceptedQty ?? 0) + (r?.damagedQty ?? 0);
          const overLimit = totalEntered > li.quantity;
          return (
            <div
              key={li.id}
              className={`rounded-xl border p-4 transition-colors ${overLimit ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'}`}
            >
              {/* Item header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{li.itemName}</p>
                  <p className="text-xs text-gray-500 font-mono">{li.itemSku}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Received Qty</p>
                  <p className="text-lg font-bold text-gray-800">{li.quantity} <span className="text-sm font-normal text-gray-500">units</span></p>
                </div>
              </div>

              {/* Qty inputs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-700 uppercase tracking-wide">
                    ✓ Accepted (Good)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={li.quantity}
                    value={r?.acceptedQty ?? 0}
                    onChange={(e) => updateResult(idx, { acceptedQty: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-red-700 uppercase tracking-wide">
                    ✗ Damaged
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={li.quantity}
                    value={r?.damagedQty ?? 0}
                    onChange={(e) => updateResult(idx, { damagedQty: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Inspector Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes…"
                    value={r?.inspectorRemarks ?? ''}
                    onChange={(e) => updateResult(idx, { inspectorRemarks: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Running total bar */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                  {li.quantity > 0 && (
                    <>
                      <div
                        className="h-full rounded-full bg-green-500 float-left"
                        style={{ width: `${Math.min(100, ((r?.acceptedQty ?? 0) / li.quantity) * 100)}%` }}
                      />
                      <div
                        className="h-full rounded-full bg-red-500 float-left"
                        style={{ width: `${Math.min(100, ((r?.damagedQty ?? 0) / li.quantity) * 100)}%` }}
                      />
                    </>
                  )}
                </div>
                <span className={`font-medium ${overLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  {totalEntered}/{li.quantity}
                </span>
              </div>

              {overLimit && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  ⚠ Accepted + damaged exceeds received quantity
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall inspector notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Overall Inspection Notes (Optional)
        </label>
        <textarea
          value={inspectorNotes}
          onChange={(e) => setInspectorNotes(e.target.value)}
          rows={3}
          placeholder="Describe general condition of the shipment, special concerns, storage recommendations…"
          className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          ⚠ {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Submit Inspection Report
        </button>
      </div>
    </form>
  );
}

// ── Main InspectionQueue component ───────────────────────────────────────────

export default function InspectionQueue() {
  const { data: grns = [], isLoading } = useGrnList('PENDING_INSPECTION');
  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null);
  const [selectedGrn, setSelectedGrn] = useState<Grn | null>(null);
  const [loadingGrn, setLoadingGrn] = useState(false);

  const openGrn = async (summary: GrnSummary) => {
    setSelectedGrnId(summary.id);
    setLoadingGrn(true);
    try {
      const full = await fetchGrn(summary.id);
      setSelectedGrn(full);
    } finally {
      setLoadingGrn(false);
    }
  };

  const closeForm = () => {
    setSelectedGrnId(null);
    setSelectedGrn(null);
  };

  if (selectedGrnId) {
    if (loadingGrn) {
      return (
        <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading GRN details…
        </div>
      );
    }
    if (selectedGrn) {
      return (
        <div className="space-y-4">
          <button
            onClick={closeForm}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Inspection Queue
          </button>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Microscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Technical Inspection</h3>
                <p className="text-sm text-gray-500">Record quality check results for each item</p>
              </div>
            </div>
            <InspectionForm grn={selectedGrn} onDone={closeForm} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
          <Microscope className="h-5 w-5 text-yellow-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Inspection Queue</h3>
          <p className="text-sm text-gray-500">
            GRNs awaiting technical quality inspection
          </p>
        </div>
        <span className="ml-auto rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-bold text-yellow-700">
          {isLoading ? '…' : grns.length} pending
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : grns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No deliveries awaiting inspection</p>
          <p className="text-sm text-gray-400">Items sent from the Storekeeper will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grns.map((grn) => (
            <div
              key={grn.id}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              onClick={() => openGrn(grn)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{grn.grnNumber}</p>
                  <p className="text-sm text-gray-500">{grn.supplierName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400">Received</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(grn.receivedDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusPill status={grn.status} />
                <span className="text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
