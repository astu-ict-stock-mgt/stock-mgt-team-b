import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Layers,
  Database,
  User as UserIcon,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks';

export function SettingsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('ETB');
  const [fiscalYear, setFiscalYear] = useState('2018 E.C. (2025/2026)');
  const [stockTakeCycle, setStockTakeCycle] = useState('Annual (End of Fiscal Year)');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {savedToast && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30">
          <CheckCircle2 className="h-5 w-5" />
          Settings successfully updated.
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            System & Organization Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Institutional parameters, inventory policy configurations, and valuation standards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Organization & Valuation Policy */}
        <div className="space-y-6 lg:col-span-2">
          {/* Organization Profile Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <Building className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">Institutional Profile</h2>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Adama Science and Technology University (ASTU)"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Division / Unit
                  </label>
                  <input
                    type="text"
                    disabled
                    value="ICT & Central Property Administration"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Fiscal Year Reference
                  </label>
                  <input
                    type="text"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Reporting Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ETB">ETB — Ethiopian Birr</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Inventory & MoFED Valuation Policy */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <Layers className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">
                Inventory Valuation & Control Policy
              </h2>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-gray-600">
              <div className="flex items-start justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                <div>
                  <span className="font-bold text-blue-900">Inventory Valuation Principle:</span>
                  <p className="mt-0.5 text-blue-700">
                    First-In, First-Out (FIFO) Valuation mandated per SRS 1.4.2 and MoFED manual.
                  </p>
                </div>
                <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-3.5">
                  <span className="font-semibold text-gray-900">Physical Stock Count Policy:</span>
                  <select
                    value={stockTakeCycle}
                    onChange={(e) => setStockTakeCycle(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-1.5 text-xs text-gray-800"
                  >
                    <option>Annual (End of Fiscal Year)</option>
                    <option>Semi-Annual (Bi-Yearly)</option>
                    <option>Quarterly Audits</option>
                  </select>
                </div>
                <div className="rounded-xl border border-gray-200 p-3.5">
                  <span className="font-semibold text-gray-900">
                    Reconciliation Approval Level:
                  </span>
                  <p className="mt-1 text-gray-500">Property Admin Officer (PAO) & Committee</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Profile & System Diagnostics */}
        <div className="space-y-6">
          {/* Current User Session */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">Current Session</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Signed In As
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  System Role
                </span>
                <p className="mt-1">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {user?.role}
                  </span>
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Assigned Department
                </span>
                <p className="text-xs text-gray-700">
                  {user?.department || 'Central Property Administration'}
                </p>
              </div>
            </div>
          </div>

          {/* System Diagnostics */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <Database className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">Platform Environment</h2>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Architecture</span>
                <span className="font-semibold text-gray-800">Three-Tier Web System</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Database Engine</span>
                <span className="font-semibold text-gray-800">PostgreSQL (Prisma ORM)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Security / RBAC</span>
                <span className="font-semibold text-gray-800">JWT + 7 Roles Enforced</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Application Version</span>
                <span className="font-mono font-semibold text-blue-600">v1.0.0-production</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
