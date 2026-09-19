import { useState } from 'react';
import { WriteOffForm } from '../components/WriteOffForm';
import { WriteOffHistory } from '../components/WriteOffHistory';

export function DamagedObsoletePage() {
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Damaged & Obsolete Stock
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage write-off requests, technical evaluations, approvals, and item disposals.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Write-Off Ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            + New Write-Off Request
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <WriteOffForm
            onSuccess={() => setActiveTab('history')}
            onCancel={() => setActiveTab('history')}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <WriteOffHistory />
        </div>
      )}
    </div>
  );
}

export default DamagedObsoletePage;
