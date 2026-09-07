import React, { useState } from 'react';
import { Trash2, AlertTriangle, PlusCircle, FileText } from 'lucide-react';
import { WriteOffHistory } from '../components/WriteOffHistory';
import { WriteOffForm } from '../components/WriteOffForm';

export const DamagedObsoletePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'request'>('history');

  const handleSuccess = () => {
    setActiveTab('history');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-950 via-slate-900 to-zinc-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 backdrop-blur-md">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Damaged & Obsolete Stock Management
              </h1>
              <p className="mt-1 text-sm text-red-200">
                Official write-off requests, inspection records, PAO disposal approvals, and
                inventory de-listing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="h-4 w-4" />
              Write-Off Ledger
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'request'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <PlusCircle className="h-4 w-4" />+ Request Write-Off
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {activeTab === 'history' ? (
          <WriteOffHistory />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Submit Write-Off / Disposal Request
                </h2>
                <p className="text-xs text-gray-500">
                  Record item condition, defect reason, inspection evidence, and estimated write-off
                  value.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-gray-500 underline hover:text-gray-700"
              >
                Back to History
              </button>
            </div>
            <WriteOffForm onSuccess={handleSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DamagedObsoletePage;
