import { useState } from 'react';
import CreateGrnForm from '../components/CreateGrnForm';
import GrnList from '../components/GrnList';

export function StockReceivingPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Stock Receiving</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record supplier deliveries, conduct item inspections, and generate Goods Received Notes
            (GRNs).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            GRN Ledger
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
            + Create New GRN
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <CreateGrnForm />
      ) : (
        <GrnList onAddNew={() => setActiveTab('create')} />
      )}
    </div>
  );
}

export default StockReceivingPage;
