import { useState, useRef, useEffect, FormEvent } from 'react';
import {
  useItems,
  useLocations,
  useAvailableSourceLocations,
  useCreateStockTransfer,
} from '../hooks';

interface ErrorContext {
  available?: number;
  location?: string;
  msg?: string;
}

/* ─── Friendly error messages ─────────────────────────────────── */
function friendlyError(key: string, ctx: ErrorContext = {}) {
  const map: Record<string, string> = {
    noItem: '👆 Please select the item you want to move first.',
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

/* ─── Inline keyframe styles & micro-animations ────────────────── */
const STYLES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes menuPop {
    0%   { opacity: 0; transform: scale(0.96) translateY(-4px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes modalPop {
    0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
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
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes arrowFlow {
    0%,100% { transform: translateX(0); opacity: 1; }
    50%     { transform: translateX(4px); opacity: 0.7; }
  }

  .anim-slide-down  { animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .anim-menu-pop    { animation: menuPop 0.18s cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: top center; }
  .anim-modal-pop   { animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .anim-shake       { animation: shake 0.45s ease-in-out; }
  .anim-fade-in     { animation: fadeIn 0.2s ease both; }
  .anim-arrow       { animation: arrowFlow 1.5s ease-in-out infinite; }

  /* ── Custom Trigger & Dropdown Menu ── */
  .custom-dropdown-btn {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .custom-dropdown-btn:hover:not(:disabled) {
    border-color: #93c5fd;
    background-color: #f8fafc;
  }
  .custom-dropdown-btn:focus-visible {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }

  .custom-option {
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .custom-option:hover {
    background-color: #eff6ff;
    transform: translateX(2px);
  }

  /* ── Enhanced Buttons ── */
  .btn-submit {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.35);
  }
  .btn-submit:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
  .btn-submit:hover:not(:disabled) .btn-icon-slide {
    transform: translateX(3px);
  }
  .btn-icon-slide {
    transition: transform 0.2s ease;
  }

  .btn-reset {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .btn-reset:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
    color: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  .btn-reset:active {
    transform: translateY(0) scale(0.98);
  }
`;

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
}

interface CustomDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  hint?: string | null;
  emptyMessage?: string;
}

/* ─── Custom Modern Hover & Click Dropdown Component ────────────── */
function CustomDropdown({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option…',
  disabled = false,
  isLoading = false,
  hint,
  emptyMessage,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hover handlers with debounce to prevent accidental close
  const handleMouseEnter = () => {
    if (disabled || isLoading) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (disabled || isLoading) return;
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleToggleClick = () => {
    if (disabled || isLoading) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  // Find currently selected option object
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className="relative space-y-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <label id={`${id}-label`} className="block text-xs font-bold text-gray-700 sm:text-sm">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label ${id}`}
        disabled={disabled || isLoading}
        onClick={handleToggleClick}
        className={`custom-dropdown-btn relative flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-xs font-medium shadow-2xs sm:text-sm ${
          isOpen ? 'border-blue-500 ring-4 ring-blue-500/15' : 'border-gray-300'
        } ${disabled || isLoading ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'text-gray-900'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isLoading && (
            <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {selectedOption ? (
            <span className="truncate font-semibold text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="truncate text-gray-400">
              {isLoading ? 'Loading options…' : placeholder}
            </span>
          )}
        </div>

        {/* Chevron with smooth rotation */}
        <div className="flex shrink-0 items-center pl-2 text-gray-400">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {hint && <p className="text-[11px] font-medium text-gray-400">{hint}</p>}

      {/* Floating Modern Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="anim-menu-pop absolute left-0 z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs font-medium text-gray-400">
              {emptyMessage || 'No options available'}
            </div>
          ) : (
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`custom-option flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium sm:text-sm ${
                      isSelected
                        ? 'bg-blue-50 font-bold text-blue-900'
                        : 'text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {/* Checkmark indicator */}
                    {isSelected && (
                      <span className="shrink-0 text-blue-600">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StockBarProps {
  available: number;
  max: number;
}

/* ─── Stock availability bar ───────────────────────────────────── */
function StockBar({ available, max }: StockBarProps) {
  if (!max && max !== 0) return null;
  const pct = Math.min(100, Math.round((available / Math.max(max, 1)) * 100));
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';
  const label = pct > 50 ? 'In Stock' : pct > 20 ? 'Low Stock' : 'Critical';

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">
          Available: <strong className="font-bold text-gray-900">{available} units</strong>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold shadow-2xs ${
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
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface TransferArrowProps {
  from?: string;
  to?: string;
}

/* ─── Transfer arrow visualizer ────────────────────────────────── */
function TransferArrow({ from, to }: TransferArrowProps) {
  if (!from || !to) return null;
  return (
    <div className="anim-slide-down my-2 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs shadow-2xs">
          📤
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">From</p>
          <p className="truncate text-xs font-semibold text-blue-900">{from}</p>
        </div>
      </div>

      <div className="anim-arrow flex shrink-0 items-center justify-center text-blue-500">
        <svg
          className="h-4 w-4 rotate-90 sm:rotate-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        <div className="min-w-0 sm:text-right">
          <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">To</p>
          <p className="truncate text-xs font-semibold text-indigo-900">{to}</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs shadow-2xs">
          📥
        </span>
      </div>
    </div>
  );
}

interface TransferConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  details: {
    itemName: string;
    fromLocationName: string;
    toLocationName: string;
    quantity: number;
  };
}

/* ─── Confirmation Modal (Compact & Interactive) ───────────────── */
function TransferConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  details,
}: TransferConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="anim-modal-pop relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:max-w-md">
        {/* Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6 sm:pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg shadow-2xs">
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
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3.5 px-5 py-3 sm:px-6">
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-gray-200/60 py-1">
              <span className="font-medium text-gray-500">Item:</span>
              <span className="font-bold text-gray-900">{details.itemName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200/60 py-1">
              <span className="font-medium text-gray-500">From Location:</span>
              <span className="font-semibold text-blue-700">{details.fromLocationName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200/60 py-1">
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

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <span className="shrink-0 text-base">⚠️</span>
            <p className="text-[11px] leading-relaxed font-medium text-amber-900 sm:text-xs">
              This will transfer <strong className="font-bold">{details.quantity} units</strong>{' '}
              from <strong className="font-bold">{details.fromLocationName}</strong> to{' '}
              <strong className="font-bold">{details.toLocationName}</strong>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3.5 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn-reset w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn-submit inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Transferring…</span>
              </>
            ) : (
              <>
                <span>Confirm Transfer</span>
                <svg
                  className="btn-icon-slide h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
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

interface TransferFormProps {
  onSuccessToast?: (msg: string) => void;
  onErrorToast?: (msg: string) => void;
}

/* ─── Main TransferForm Component ───────────────────────────────── */
export function TransferForm({ onSuccessToast, onErrorToast }: TransferFormProps) {
  const [selectedItemId, setSelectedItemId] = useState('item-1');
  const [fromLocationId, setFromLocationId] = useState('loc-1');
  const [toLocationId, setToLocationId] = useState('loc-2');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorCtx, setErrorCtx] = useState<ErrorContext>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: allDestLocations = [] } = useLocations();
  const { availableLocations: sourceLocations = [], isLoading: isLoadingStock } =
    useAvailableSourceLocations(selectedItemId || undefined);
  const transferMutation = useCreateStockTransfer();

  // Derive effective selections
  const effectiveFromLocationId = sourceLocations.some((l) => l.locationId === fromLocationId)
    ? fromLocationId
    : sourceLocations[0]?.locationId || '';

  const destinationOptions = allDestLocations.filter((l) => l.id !== effectiveFromLocationId);

  const effectiveToLocationId = destinationOptions.some((l) => l.id === toLocationId)
    ? toLocationId
    : destinationOptions[0]?.id || '';

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedSource = sourceLocations.find((l) => l.locationId === effectiveFromLocationId);
  const selectedDest = allDestLocations.find((l) => l.id === effectiveToLocationId);
  const availableStock = selectedSource ? selectedSource.availableQuantity : 0;
  const maxStock = Math.max(availableStock, 50);

  // Transform raw data to dropdown options format
  const itemOptions: DropdownOption[] = items.map((i) => ({
    value: i.id,
    label: i.name,
    badge: i.itemCode,
  }));

  const sourceLocationOptions: DropdownOption[] = sourceLocations.map((loc) => ({
    value: loc.locationId,
    label: loc.locationName,
    badge: `${loc.availableQuantity} available`,
  }));

  const destinationLocationOptions: DropdownOption[] = destinationOptions.map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  function triggerError(key: string, ctx: ErrorContext = {}) {
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

  function handleOpenConfirm(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (!selectedItemId) return triggerError('noItem');
    if (!effectiveFromLocationId) return triggerError('noSource');
    if (!effectiveToLocationId) return triggerError('noDest');
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
        `✅ Transferred ${quantity} units of ${selectedItem?.name} from ${selectedSource?.locationName} to ${selectedDest?.name}.`
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
        className={`rounded-2xl border border-gray-200 bg-white shadow-md transition-all ${
          shakeKey > 0 && errorKey ? 'anim-shake' : ''
        }`}
      >
        {/* Card Header */}
        <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg text-white shadow-xs backdrop-blur-xs sm:h-10 sm:w-10 sm:text-xl">
              🔄
            </div>
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">Transfer Stock</h2>
              <p className="text-xs text-blue-100">Move inventory between locations</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {/* User-friendly Error Banner */}
          {errorKey && (
            <div className="anim-slide-down mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 shadow-2xs sm:p-3.5">
              <span className="mt-0.5 shrink-0 text-base">❗</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-800 sm:text-sm">
                  {friendlyError(errorKey, errorCtx)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="shrink-0 cursor-pointer rounded-md p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleOpenConfirm} className="space-y-4">
            {/* 1. Item Selection (Custom Hover/Click Dropdown) */}
            <CustomDropdown
              id="item-select"
              label="Item"
              value={selectedItemId}
              onChange={(val) => {
                setSelectedItemId(val);
                clearError();
              }}
              options={itemOptions}
              disabled={isLoadingItems}
              isLoading={isLoadingItems}
              placeholder="Select an item…"
              hint={
                selectedItem
                  ? `Category: ${selectedItem.category} · Code: ${selectedItem.itemCode}`
                  : null
              }
            />

            {/* 2. From Location (Source) Dropdown */}
            <CustomDropdown
              id="from-location-select"
              label="From Location (Source)"
              value={effectiveFromLocationId}
              onChange={(val) => {
                setFromLocationId(val);
                clearError();
              }}
              options={sourceLocationOptions}
              disabled={!selectedItemId || isLoadingStock || sourceLocations.length === 0}
              isLoading={isLoadingStock}
              placeholder={
                !selectedItemId
                  ? 'Select an item first…'
                  : isLoadingStock
                    ? 'Checking stock…'
                    : 'No locations have stock'
              }
              emptyMessage="No warehouses have available stock of this item."
            />

            {/* No-stock Warning */}
            {selectedItemId && sourceLocations.length === 0 && !isLoadingStock && (
              <div className="anim-slide-down rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-2xs">
                <p className="text-xs font-medium text-amber-800 sm:text-sm">
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
            <TransferArrow from={selectedSource?.locationName} to={selectedDest?.name} />

            {/* 3. To Location (Destination) Dropdown */}
            <CustomDropdown
              id="to-location-select"
              label="To Location (Destination)"
              value={effectiveToLocationId}
              onChange={(val) => {
                setToLocationId(val);
                clearError();
              }}
              options={destinationLocationOptions}
              disabled={!effectiveFromLocationId || destinationOptions.length === 0}
              placeholder="Select destination…"
              emptyMessage="No available destination locations."
            />

            {/* 4. Quantity Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="transfer-quantity"
                className="block text-xs font-bold text-gray-700 sm:text-sm"
              >
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 pr-16 text-xs font-medium text-gray-900 shadow-2xs transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden sm:text-sm"
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
                <p className="anim-slide-down text-xs font-bold text-red-600">
                  ⚡ Exceeds available stock of {availableStock} units!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse items-center justify-between gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                className="btn-reset w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 sm:w-auto sm:text-sm"
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
                className="btn-submit inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
              >
                <svg
                  className="btn-icon-slide h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span>Transfer Stock</span>
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
