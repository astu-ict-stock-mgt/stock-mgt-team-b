/**
 * PaoApprovalQueue.tsx
 * SRS Reference: 4.4.11 - PAO final approval of received goods
 * Workflow Stage 5: PAO approves (commits stock) or rejects with reason
 */
import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Warehouse,
  ArrowRight,
} from 'lucide-react';
import { useGrnList, useApproveGrn, useRejectGrn } from '../hooks';
import { fetchGrn, type Grn, type GrnSummary } from '../api';

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT:                { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    PENDING_INSPECTION:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Inspection' },
    INSPECTED:            { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Inspected' },
    PENDING_PAO_APPROVAL: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Awaiting PAO Approval' },
    APPROVED:             { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved ✓' },
    REJECTED:             { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

interface PaoDetailProps {
  grn: Grn;
  onDone: () => void;
}

function PaoDetail({ grn, onDone }: PaoDetailProps) {
  const { mutate: approve, isPending: approvePending } = useApproveGrn();
  const { mutate: reject, isPending: rejectPending } = useRejectGrn();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalAccepted = grn.lineItems.reduce((s, i) => s + (i.acceptedQty ?? i.quantity), 0);
  const totalDamaged = grn.lineItems.reduce((s, i) => s + (i.damagedQty ?? 0), 0);
  const acceptedValue = grn.lineItems.reduce(
    (s, i) => s + (i.acceptedQty ?? i.quantity) * i.unitCost,
    0
  );

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(n);

  const handleApprove = () => {
    setError(null);
    approve(grn.id, {
      onSuccess: () => {
        setSuccess('GRN approved! Stock has been committed to inventory.');
        setTimeout(onDone, 2500);
      },
      onError: (err) => setError((err as Error).message),
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setError(null);
    reject(
      { id: grn.id, reason: rejectReason },
      {
        onSuccess: () => {
          setSuccess('GRN rejected.');
          setTimeout(onDone, 2000);
        },
        onError: (err) => setError((err as Error).message),
      }
    );
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onDone}
        className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
      >
        ← Back to Approval Queue
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">{grn.grnNumber}</h3>
            </div>
            <p className="text-sm text-gray-500">
              {grn.supplierName} · {new Date(grn.receivedDate).toLocaleDateString()}
            </p>
          </div>
          <StatusPill status={grn.status} />
        </div>

        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-green-50 p-3 text-center">
            <p className="text-xl font-bold text-green-700">{totalAccepted}</p>
            <p className="text-xs font-medium text-green-600">Good Units</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <p className="text-xl font-bold text-red-700">{totalDamaged}</p>
            <p className="text-xs font-medium text-red-600">Damaged Units</p>
          </div>
          <div className="col-span-2 rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-800">{fmtCurrency(acceptedValue)}</p>
            <p className="text-xs font-medium text-gray-500">Value to Commit</p>
          </div>
        </div>

        {/* Inspector notes */}
        {grn.inspectorNotes && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
            <p className="mb-1 font-semibold">Inspector Notes:</p>
            <p className="text-gray-700">{grn.inspectorNotes}</p>
          </div>
        )}

        {/* Destination summary per item */}
        <div className="mb-5 space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Stock Routing Plan</h4>
          {grn.lineItems.map((li) => {
            const accepted = li.acceptedQty ?? li.quantity;
            const damaged = li.damagedQty ?? 0;
            return (
              <div
                key={li.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <p className="font-semibold text-gray-800 mb-2">{li.itemName}</p>
                <div className="flex flex-wrap gap-2">
                  {accepted > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                      <Warehouse className="h-3 w-3" />
                      {accepted} → <strong>{grn.warehouseName}</strong>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                  {damaged > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                      <AlertTriangle className="h-3 w-3" />
                      {damaged} → <strong>Damaged Store</strong>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
                {li.inspectorRemarks && (
                  <p className="mt-1 text-xs text-gray-500 italic">"{li.inspectorRemarks}"</p>
                )}
              </div>
            );
          })}
        </div>

        {/* PAO action */}
        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-800 font-semibold">
            <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-green-600" />
            {success}
          </div>
        ) : showRejectForm ? (
          <form onSubmit={handleReject} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this receiving note is being rejected…"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none resize-none"
              autoFocus
            />
            {error && <p className="text-sm text-red-600">⚠ {error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowRejectForm(false); setError(null); }}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {rejectPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Confirm Rejection
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                ⚠ {error}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setShowRejectForm(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <ThumbsDown className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approvePending}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
              >
                {approvePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Approve & Commit Stock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main PAO Approval Queue ──────────────────────────────────────────────────

export default function PaoApprovalQueue() {
  const { data: pendingGrns = [], isLoading } = useGrnList('PENDING_PAO_APPROVAL');

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
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      );
    }
    if (selectedGrn) return <PaoDetail grn={selectedGrn} onDone={closeForm} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <ShieldCheck className="h-5 w-5 text-purple-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">PAO Approval Queue</h3>
          <p className="text-sm text-gray-500">
            Approve to commit goods to inventory — or reject with reason
          </p>
        </div>
        <span className="ml-auto rounded-full bg-purple-100 px-3 py-0.5 text-sm font-bold text-purple-700">
          {isLoading ? '…' : pendingGrns.length} pending
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : pendingGrns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <ShieldCheck className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No GRNs awaiting PAO approval</p>
          <p className="text-sm text-gray-400">Confirmed deliveries from Storekeeper appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingGrns.map((grn) => (
            <div
              key={grn.id}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-purple-100 bg-white p-4 shadow-sm transition-all hover:border-purple-400 hover:shadow-md"
              onClick={() => openGrn(grn)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{grn.grnNumber}</p>
                  <p className="text-sm text-gray-500">{grn.supplierName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-gray-400">Value</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Intl.NumberFormat('en-ET', {
                      style: 'currency',
                      currency: 'ETB',
                    }).format(grn.totalValue)}
                  </p>
                </div>
                <StatusPill status={grn.status} />
                <span className="text-xs font-medium text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Review →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
