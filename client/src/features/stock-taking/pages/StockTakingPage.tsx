import { useState } from 'react';
import { CountWorksheet } from '../components/CountWorksheet';
import { ReconciliationReview } from '../components/ReconciliationReview';
import { useAuth } from '../../auth/hooks';
import { ClipboardList, ShieldCheck, UserCheck } from 'lucide-react';

export function StockTakingPage() {
  const { user } = useAuth();

  // Role simulation state for ADMINISTRATOR
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const activeRole = simulatedRole || user?.role || 'STOCK_CLERK';

  const isPaoOrAdmin =
    activeRole === 'PAO' ||
    activeRole === 'ADMINISTRATOR' ||
    activeRole === 'PROPERTY_ADMINISTRATION_OFFICER';

  // Default active tab: PAO/Admin starts on 'reconciliations', Clerk/Storekeeper on 'worksheet'
  const [activeTab, setActiveTab] = useState<'worksheet' | 'reconciliations'>(
    isPaoOrAdmin ? 'reconciliations' : 'worksheet'
  );

  return (
    <div className="space-y-6">
      {/* Administrator Role Switcher Simulation */}
      {user?.role === 'ADMINISTRATOR' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>
              <strong>Admin Simulation Mode:</strong> Testing role views for Stock Taking
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSimulatedRole('STOCK_CLERK');
                setActiveTab('worksheet');
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 font-semibold transition ${
                activeRole === 'STOCK_CLERK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-100'
              }`}
            >
              Stock Clerk
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedRole('STOREKEEPER');
                setActiveTab('worksheet');
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 font-semibold transition ${
                activeRole === 'STOREKEEPER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-100'
              }`}
            >
              Storekeeper
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedRole('PAO');
                setActiveTab('reconciliations');
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 font-semibold transition ${
                activeRole === 'PAO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-100'
              }`}
            >
              PAO Approver
            </button>
            {simulatedRole && (
              <button
                type="button"
                onClick={() => setSimulatedRole(null)}
                className="ml-1 cursor-pointer text-[11px] text-blue-600 underline hover:text-blue-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Level Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('worksheet')}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'worksheet'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Physical Count Worksheet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliations')}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'reconciliations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Reconciliation Approvals</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'worksheet' ? <CountWorksheet /> : <ReconciliationReview />}
    </div>
  );
}

export default StockTakingPage;
