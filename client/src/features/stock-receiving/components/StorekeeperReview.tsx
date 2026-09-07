/**
 * StorekeeperReview.tsx
 * SRS Reference: 4.4.10 - Storekeeper reviews inspection report and confirms routing
 * Workflow Stage 4: Storekeeper sees inspected GRNs, confirms routing to correct stores
 */
import { useState } from 'react';
import {
  ClipboardCheck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Warehouse,
} from 'lucide-react';
import { useGrnList, useConfirmRouting, useSendToInspection } from '../hooks';
import { fetchGrn, type Grn, type GrnSummary } from '../api';

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT:                { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    PENDING_INSPECTION:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Inspection' },
    INSPECTED:            { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Inspected ✓' },
    PENDING_PAO_APPROVAL: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Awaiting PAO Approval' },
    APPROVED:             { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    REJECTED:             { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

interface RoutingDetailProps {
  grn: Grn;
  onDone: () => void;
}

function RoutingDetail({ grn, onDone }: RoutingDetailProps) {
  const { mutate: confirmRouting, isPending: confirmPending } = useConfirmRouting();
  const [error, setError] = useState<string | null>(null);

  const totalAccepted = grn.lineItems.reduce((s, i) => s + (i.acceptedQty ?? i.quantity), 0);
  const totalDamaged = grn.lineItems.reduce((s, i) => s + (i.damagedQty ?? 0), 0);
  const totalValue = grn.lineItems.reduce((s, i) => s + (i.acceptedQty ?? i.quantity) * i.unitCost, 0);

  const handleConfirm = () => {
    setError(null);
    confirmRouting(grn.id, {
      onSuccess: () => onDone(),
      onError: (err) => setError((err as Error).message),
    });
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onDone}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to Review Queue
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* GRN Identity */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{grn.grnNumber}</h3>
            <p className="text-sm text-gray-500">
              {grn.supplierName} · {new Date(grn.receivedDate).toLocaleDateString()}
            </p>
          </div>
          <StatusPill status={grn.status} />
        </div>

        {/* Inspector notes */}
        {grn.inspectorNotes && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
            <p className="mb-1 font-semibold">Inspector Notes:</p>
            <p>{grn.inspectorNotes}</p>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{totalAccepted}</p>
            <p className="text-xs text-green-600 font-medium">Accepted Units</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{totalDamaged}</p>
            <p className="text-xs text-red-600 font-medium">Damaged Units</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xl font-bold text-gray-700">
              {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(totalValue)}
            </p>
            <p className="text-xs text-gray-500 font-medium">Accepted Value</p>
          </div>
        </div>

        {/* Routing breakdown per item */}
        <div className="mb-5 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Item Routing Plan</h4>
          {grn.lineItems.map((li) => {
            const accepted = li.acceptedQty ?? li.quantity;
            const damaged = li.damagedQty ?? 0;
            return (
              <div key={li.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="font-semibold text-gray-800 mb-2">{li.itemName}</p>
                <div className="flex flex-wrap gap-3">
                  {accepted > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      <Warehouse className="h-3.5 w-3.5" />
                      {accepted} units → <strong>{grn.warehouseName}</strong>
                      <ArrowRight className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                  {damaged > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {damaged} units → <strong>Damaged Store</strong>
                      <ArrowRight className="h-3 w-3 text-red-600" />
                    </div>
                  )}
                  {li.inspectorRemarks && (
                    <span className="text-xs text-gray-500 italic">"{li.inspectorRemarks}"</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onDone}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Review Later
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmPending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
          >
            {confirmPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm Routing — Send to PAO
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main StorekeeperReview Component ────────────────────────────────────────────

export default function StorekeeperReview() {
  const { data: grns = [], isLoading } = useGrnList('INSPECTED');
  const { mutate: sendToInspection, isPending: sendPending } = useSendToInspection();
  const { data: draftGrns = [] } = useGrnList('DRAFT');

  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null);
  const [selectedGrn, setSelectedGrn] = useState<Grn | null>(null);
  const [loadingGrn, setLoadingGrn] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

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

  const handleSendToInspection = (id: string) => {
    setSendingId(id);
    sendToInspection(id, { onSettled: () => setSendingId(null) });
  };

  if (selectedGrnId) {
    if (loadingGrn) {
      return (
        <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      );
    }
    if (selectedGrn) return <RoutingDetail grn={selectedGrn} onDone={closeForm} />;
  }

  return (
    <div className="space-y-6">
      {/* Draft GRNs waiting to be sent to inspection */}
      {draftGrns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Drafts — Send to Inspection
            </h4>
          </div>
          {draftGrns.map((grn) => (
            <div
              key={grn.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-800">{grn.grnNumber}</p>
                  <p className="text-xs text-gray-500">{grn.supplierName}</p>
                </div>
              </div>
              <button
                onClick={() => handleSendToInspection(grn.id)}
                disabled={sendPending && sendingId === grn.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
              >
                {sendPending && sendingId === grn.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                Send to Inspection
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inspected GRNs awaiting routing confirmation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Inspected — Awaiting Routing Confirmation
          </h4>
          <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            {isLoading ? '…' : grns.length}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-28 items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : grns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <ClipboardCheck className="mb-3 h-9 w-9 text-gray-300" />
            <p className="font-medium text-gray-500">No inspected GRNs awaiting confirmation</p>
          </div>
        ) : (
          grns.map((grn) => (
            <div
              key={grn.id}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              onClick={() => openGrn(grn)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{grn.grnNumber}</p>
                  <p className="text-sm text-gray-500">{grn.supplierName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusPill status={grn.status} />
                <span className="text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Review & Route →
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
