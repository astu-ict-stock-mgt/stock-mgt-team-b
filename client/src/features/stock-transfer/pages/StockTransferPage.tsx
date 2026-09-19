import { useState } from 'react';
import { TransferForm } from '../components/TransferForm';
import { TransferHistory } from '../components/TransferHistory';

const TOAST_STYLES = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes progressBar {
    from { width: 100%; }
    to   { width: 0%; }
  }
  .toast-in { animation: toastIn 0.3s cubic-bezier(.175,.885,.32,1.2) both; }
  .toast-progress { animation: progressBar 4.5s linear forwards; }
`;

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function Toast({ message, type, onClose }: ToastProps) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`toast-in relative overflow-hidden rounded-2xl border shadow-lg ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-red-200 bg-red-50 text-red-900'
      }`}
    >
      <div className="flex items-start gap-2.5 p-3.5 sm:p-4">
        <span className="mt-0.5 shrink-0 text-lg sm:text-xl">{isSuccess ? '✅' : '❌'}</span>
        <p className="flex-1 text-xs leading-relaxed font-semibold sm:text-sm">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 cursor-pointer rounded-lg p-1 transition-colors ${
            isSuccess ? 'text-emerald-500 hover:bg-emerald-100' : 'text-red-400 hover:bg-red-100'
          }`}
          aria-label="Close notification"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={`toast-progress h-1 ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`} />
    </div>
  );
}

export function StockTransferPage() {
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>{TOAST_STYLES}</style>
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="px-1">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
          Stock Transfer
        </h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          Manage, record, and track inventory movements between locations.
        </p>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <TransferForm
            onSuccessToast={(msg) => showToast(msg, 'success')}
            onErrorToast={(msg) => showToast(msg, 'error')}
          />
        </div>
        <div className="lg:col-span-7">
          <TransferHistory />
        </div>
      </div>
    </div>
  );
}
