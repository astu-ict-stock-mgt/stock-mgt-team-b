// @ts-nocheck
import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { TransferForm } from './features/stock-transfer/components/TransferForm';
import { TransferHistory } from './features/stock-transfer/components/TransferHistory';

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

function Toast({ message, type, onClose }) {
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
        <p className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className={`cursor-pointer shrink-0 rounded-lg p-1 transition-colors ${
            isSuccess ? 'text-emerald-500 hover:bg-emerald-100' : 'text-red-400 hover:bg-red-100'
          }`}
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={`toast-progress h-1 ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`} />
    </div>
  );
}

function StockTransferView() {
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-3 sm:p-6 lg:p-8">
      <style>{TOAST_STYLES}</style>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Page Header */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
            Stock Transfer
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
            <Link to="/" className="transition-colors hover:text-gray-600 font-medium">Home</Link>
            <span>/</span>
            <span className="font-semibold text-blue-600">Stock Transfer</span>
          </div>
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
    </div>
  );
}

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Management System</h1>
      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
        Welcome to the stock management platform. Feature modules will be added under{' '}
        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">client/src/features/</code>.
      </p>
      <nav className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
        <Link
          to="/dashboard"
          className="rounded-xl bg-gray-900 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-gray-800"
        >
          Dashboard
        </Link>
        <Link
          to="/stock-transfer"
          className="rounded-xl bg-blue-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-blue-700 shadow-md shadow-blue-200"
        >
          Stock Transfer
        </Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-3 text-xs sm:text-sm text-gray-600">Placeholder dashboard.</p>
      <Link to="/" className="mt-6 inline-block text-xs sm:text-sm font-semibold text-blue-600 hover:underline">
        ← Back home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/stock-transfer" element={<StockTransferView />} />
    </Routes>
  );
}
