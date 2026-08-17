// @ts-nocheck
import { useState } from 'react';
import {
  useItems,
  useLocations,
  useAvailableSourceLocations,
  useCreateStockTransfer,
} from '../hooks';

/* ─── Friendly error messages ─────────────────────────────────── */
function friendlyError(key, ctx = {}) {
  const map = {
    noItem: '👆 Please choose the item you want to move first.',
    noSource: '📍 Pick a source location — where is the item coming from?',
    noDest: '🎯 Choose a destination — where should the item go?',
    sameLocation:
      "🔄 Source and destination must be different locations. You can't move to the same place!",
    noQuantity: '🔢 Enter how many units you want to transfer.',
    zeroQuantity: '🔢 Quantity must be at least 1 unit.',
    exceedsStock: `📦 You only have ${ctx.available} unit${ctx.available !== 1 ? 's' : ''} at ${ctx.location}. Try a smaller number.`,
    transferFailed: ctx.msg || '❌ Transfer failed. Please try again.',
  };
  return map[key] ?? '⚠️ Please review your inputs and try again.';
}

/* ─── Inline keyframe styles ───────────────────────────────────── */
const STYLES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    15%      { transform: translateX(-6px); }
    30%      { transform: translateX(6px); }
    45%      { transform: translateX(-4px); }
    60%      { transform: translateX(4px); }
    75%      { transform: translateX(-2px); }
    90%      { transform: translateX(2px); }
  }
  @keyframes modalPop {
    0%   { opacity: 0; transform: scale(0.9) translateY(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes arrowPulse {
    0%,100% { transform: translateX(0); opacity: 1; }
    50%     { transform: translateX(4px); opacity: 0.6; }
  }
  @keyframes progressFill {
    from { width: 0%; }
  }
  .anim-slide-down  { animation: slideDown 0.28s ease-out both; }
  .anim-slide-up    { animation: slideUp 0.32s ease-out both; }
  .anim-shake       { animation: shake 0.45s ease-in-out; }
  .anim-modal-pop   { animation: modalPop 0.25s cubic-bezier(.175,.885,.32,1.15) both; }
  .anim-fade-in     { animation: fadeIn 0.2s ease both; }
  .anim-arrow       { animation: arrowPulse 1.4s ease-in-out infinite; }
  .anim-progress    { animation: progressFill 0.6s ease-out both; }

  .select-field {
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .select-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
  }
  .select-field:not(:disabled):hover {
    border-color: #93c5fd;
  }
  .input-field {
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .input-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
  }
  .btn-primary {
    transition: background-color 0.18s, transform 0.15s, box-shadow 0.18s;
  }
  .btn-primary:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37,99,235,0.3);
  }
  .btn-primary:not(:disabled):active {
    transform: translateY(0);
  }
  .btn-secondary {
    transition: background-color 0.18s, transform 0.15s;
  }
  .btn-secondary:hover {
    transform: translateY(-1px);
  }
`;

/* ─── Stock availability bar ───────────────────────────────────── */
function StockBar({ available, max }) {
  if (!max && max !== 0) return null;
  const pct = Math.min(100, Math.round((available / Math.max(max, 1)) * 100));
  const color =
    pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';
  const label =
    pct > 50 ? 'In Stock' : pct > 20 ? 'Low Stock' : 'Critical';

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/70 p-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">
          Available: <span className="font-bold text-gray-900">{available} units</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            pct > 50
              ? 'bg-emerald-100 text-emerald-800'
              : pct > 20
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`anim-progress h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Transfer arrow visualizer ────────────────────────────────── */
function TransferArrow({ from, to }) {
  if (!from || !to) return null;
  return (
    <div className="anim-slide-down my-2 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs">
          📤
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">From</p>
          <p className="truncate text-xs font-semibold text-blue-900">{from}</p>
        </div>
      </div>

      <div className="anim-arrow flex shrink-0 items-center justify-center text-blue-500">
        <svg className="h-4 w-4 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        <div className="min-w-0 sm:text-right">
          <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">To</p>
          <p className="truncate text-xs font-semibold text-indigo-900">{to}</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs">
          📥
        </span>
      </div>
    </div>
  );
}

/* ─── Compact, Attractive Modal (Not Fullscreen) ─────────────────── */
function TransferConfirmModal({ isOpen, onClose, onConfirm, isPending, details }) {
  if (!isOpen) return null;
  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Compact non-fullscreen container */}
      <div className="anim-modal-pop relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6 sm:pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg shadow-xs">
              📦
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-gray-900">
                Confirm Transfer
              </h3>
              <p className="text-xs text-gray-500">Please review transfer details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3.5 px-5 py-3 sm:px-6">
          {/* Details Card */}
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="font-medium text-gray-500">Item:</span>
              <span className="font-bold text-gray-900">{details.itemName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="font-medium text-gray-500">From Location:</span>
              <span className="font-semibold text-blue-700">{details.fromLocationName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="font-medium text-gray-500">To Location:</span>
              <span className="font-semibold text-indigo-700">{details.toLocationName}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium text-gray-500">Transfer Quantity:</span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 font-extrabold text-blue-800">
                {details.quantity} units
              </span>
            </div>
          </div>

          {/* Alert Notice */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 sm:p-3">
            <span className="text-base shrink-0">⚠️</span>
            <p className="text-[11px] sm:text-xs leading-relaxed text-amber-900 font-medium">
              This will immediately adjust the inventory count in{' '}
              <span className="font-bold">{details.fromLocationName}</span> and{' '}
              <span className="font-bold">{details.toLocationName}</span>.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6 sm:py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn-secondary w-full sm:w-auto cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn-primary w-full sm:w-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Transferring…</span>
              </>
            ) : (
              <>
                <span>Confirm Transfer</span>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SelectField helper with responsive touch targets ────────────── */
function SelectField({ id, label, value, onChange, disabled, children, hint, isLoading }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        {isLoading && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`select-field w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-2.5 pr-10 text-xs sm:text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
            isLoading ? 'pl-9' : 'pl-3.5'
          }`}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

/* ─── Main TransferForm Component ───────────────────────────────── */
export function TransferForm({ onSuccessToast, onErrorToast }) {
  const [selectedItemId, setSelectedItemId] = useState('item-1');
  const [fromLocationId, setFromLocationId] = useState('loc-1');
  const [toLocationId, setToLocationId]     = useState('loc-2');
  const [quantity, setQuantity]             = useState(10);
  const [errorKey, setErrorKey]             = useState(null);
  const [errorCtx, setErrorCtx]             = useState({});
  const [shakeKey, setShakeKey]             = useState(0);
  const [isConfirmOpen, setIsConfirmOpen]   = useState(false);

  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: allDestLocations = [] } = useLocations();
  const { availableLocations: sourceLocations, isLoading: isLoadingStock } =
    useAvailableSourceLocations(selectedItemId || null);
  const transferMutation = useCreateStockTransfer();

  // Derive effective selections
  const effectiveFromLocationId = sourceLocations.some((l) => l.locationId === fromLocationId)
    ? fromLocationId
    : sourceLocations[0]?.locationId || '';

  const destinationOptions = allDestLocations.filter((l) => l.id !== effectiveFromLocationId);

  const effectiveToLocationId = destinationOptions.some((l) => l.id === toLocationId)
    ? toLocationId
    : destinationOptions[0]?.id || '';

  const selectedItem   = items.find((i) => i.id === selectedItemId);
  const selectedSource = sourceLocations.find((l) => l.locationId === effectiveFromLocationId);
  const selectedDest   = allDestLocations.find((l) => l.id === effectiveToLocationId);
  const availableStock = selectedSource ? selectedSource.availableQuantity : 0;
  const maxStock       = Math.max(availableStock, 50);

  function triggerError(key, ctx = {}) {
    setErrorKey(key);
    setErrorCtx(ctx);
    setShakeKey((k) => k + 1);
  }

  function clearError() {
    setErrorKey(null);
    setErrorCtx({});
  }

  function handleReset() {
    setSelectedItemId('');
    setFromLocationId('');
    setToLocationId('');
    setQuantity('');
    clearError();
  }

  function handleOpenConfirm(e) {
    e.preventDefault();
    clearError();

    if (!selectedItemId)          return triggerError('noItem');
    if (!effectiveFromLocationId) return triggerError('noSource');
    if (!effectiveToLocationId)   return triggerError('noDest');
    if (effectiveFromLocationId === effectiveToLocationId) return triggerError('sameLocation');

    const numQty = Number(quantity);
    if (!quantity || isNaN(numQty) || numQty <= 0) return triggerError('zeroQuantity');
    if (numQty > availableStock)
      return triggerError('exceedsStock', {
        available: availableStock,
        location: selectedSource?.locationName,
      });

    setIsConfirmOpen(true);
  }

  async function handleExecuteTransfer() {
    if (!selectedItemId || !effectiveFromLocationId || !effectiveToLocationId || !quantity) return;
    try {
      await transferMutation.mutateAsync({
        itemId: selectedItemId,
        fromLocationId: effectiveFromLocationId,
        toLocationId: effectiveToLocationId,
        quantity: Number(quantity),
        transferredBy: 'Admin User',
      });
      setIsConfirmOpen(false);
      onSuccessToast?.(
        `✅ Transferred ${quantity} × ${selectedItem?.name} from ${selectedSource?.locationName} → ${selectedDest?.name}.`
      );
      setQuantity('');
      clearError();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed.';
      triggerError('transferFailed', { msg });
      onErrorToast?.(msg);
      setIsConfirmOpen(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>

      <div
        key={shakeKey > 0 ? `shake-${shakeKey}` : 'form'}
        className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md ${
          shakeKey > 0 && errorKey ? 'anim-shake' : ''
        }`}
      >
        {/* Card header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/20 text-lg sm:text-xl shadow-xs">
              🔄
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Transfer Stock</h2>
              <p className="text-xs text-blue-100">Move inventory between locations</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {/* User-friendly Error Banner */}
          {errorKey && (
            <div className="anim-slide-down mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 sm:p-3.5">
              <span className="mt-0.5 shrink-0 text-base">❗</span>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-red-800">
                  {friendlyError(errorKey, errorCtx)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="cursor-pointer shrink-0 text-red-400 transition-colors hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleOpenConfirm} className="space-y-3.5 sm:space-y-4">
            {/* 1. Item Selection */}
            <SelectField
              id="item-select"
              label="Item"
              value={selectedItemId}
              onChange={(e) => { setSelectedItemId(e.target.value); clearError(); }}
              disabled={isLoadingItems}
              isLoading={isLoadingItems}
              hint={selectedItem ? `Category: ${selectedItem.category} · Code: ${selectedItem.itemCode}` : null}
            >
              <option value="" disabled>Select an item…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </SelectField>

            {/* 2. From Location — AC1: only locations with availableQuantity > 0 */}
            <SelectField
              id="from-location-select"
              label="From Location (Source)"
              value={effectiveFromLocationId}
              onChange={(e) => { setFromLocationId(e.target.value); clearError(); }}
              disabled={!selectedItemId || isLoadingStock || sourceLocations.length === 0}
              isLoading={isLoadingStock}
            >
              {sourceLocations.length === 0 ? (
                <option value="" disabled>
                  {!selectedItemId
                    ? 'Select an item first…'
                    : isLoadingStock
                    ? 'Checking stock…'
                    : 'No locations have this item in stock'}
                </option>
              ) : (
                <>
                  <option value="" disabled>Select source location…</option>
                  {sourceLocations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId}>
                      {loc.locationName} ({loc.availableQuantity} available)
                    </option>
                  ))}
                </>
              )}
            </SelectField>

            {/* No-stock Warning */}
            {selectedItemId && sourceLocations.length === 0 && !isLoadingStock && (
              <div className="anim-slide-down rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs sm:text-sm text-amber-800 font-medium">
                  🏷️ This item has <strong>no available stock</strong> at any location.
                </p>
              </div>
            )}

            {/* Stock Progress Bar */}
            {selectedSource && (
              <div className="anim-slide-down">
                <StockBar available={availableStock} max={maxStock} />
              </div>
            )}

            {/* Visual Route Flow Indicator */}
            <TransferArrow
              from={selectedSource?.locationName}
              to={selectedDest?.name}
            />

            {/* 3. To Location Selection */}
            <SelectField
              id="to-location-select"
              label="To Location (Destination)"
              value={effectiveToLocationId}
              onChange={(e) => { setToLocationId(e.target.value); clearError(); }}
              disabled={!effectiveFromLocationId || destinationOptions.length === 0}
            >
              <option value="" disabled>Select destination…</option>
              {destinationOptions.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </SelectField>

            {/* 4. Quantity Input */}
            <div className="space-y-1">
              <label htmlFor="transfer-quantity" className="block text-xs sm:text-sm font-semibold text-gray-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="transfer-quantity"
                  type="number"
                  min="1"
                  max={availableStock > 0 ? availableStock : undefined}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0));
                    clearError();
                  }}
                  placeholder="Enter quantity…"
                  className="input-field w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-16 text-xs sm:text-sm text-gray-900"
                />
                {availableStock > 0 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                      max {availableStock}
                    </span>
                  </div>
                )}
              </div>
              {availableStock > 0 && Number(quantity) > availableStock && (
                <p className="anim-slide-down text-xs font-medium text-red-600">
                  ⚡ Exceeds available stock of {availableStock} units!
                </p>
              )}
            </div>

            {/* Action Buttons — fully responsive */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary w-full sm:w-auto cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={
                  transferMutation.isPending ||
                  !selectedItemId ||
                  !effectiveFromLocationId ||
                  !effectiveToLocationId
                }
                className="btn-primary w-full sm:w-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                Transfer Stock
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TransferConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteTransfer}
        isPending={transferMutation.isPending}
        details={{
          itemName: selectedItem?.name || '',
          fromLocationName: selectedSource?.locationName || '',
          toLocationName: selectedDest?.name || '',
          quantity: Number(quantity) || 0,
        }}
      />
    </>
  );
}
