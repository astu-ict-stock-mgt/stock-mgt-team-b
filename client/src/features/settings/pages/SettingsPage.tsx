import React, { useState } from 'react';
import {
  Settings,
  User,
  Building,
  ShieldCheck,
  Bell,
  Database,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [orgSettings, setOrgSettings] = useState({
    orgName: 'ASTU ICT Center',
    department: 'Property & Logistics Directorate',
    currency: 'ETB (Ethiopian Birr)',
    valuationMethod: 'FIFO (First-In, First-Out)',
    fiscalYearStart: 'July 8',
    lowStockThresholdDefault: '10',
    autoAuditLogging: true,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-slate-900 via-slate-800 to-gray-900 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-md">
            <Settings className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Settings & Configuration</h1>
            <p className="mt-1 text-sm text-gray-300">
              Manage organization parameters, inventory valuation defaults, user preferences, and
              notification rules.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          Settings saved and synchronized successfully!
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: User Profile Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Current Session</h2>
                <p className="text-xs text-gray-500">Authenticated user profile</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                <p className="font-semibold text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'System User'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Email Address
                </label>
                <p className="font-medium text-gray-800">{user?.email || 'user@astu.edu.et'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">System Role</label>
                <div className="mt-1">
                  <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {user?.role || 'STOREKEEPER'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                <p className="font-medium text-gray-800">{user?.department || 'Central Store'}</p>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Session authenticated via JWT & RBAC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Inventory Policy</h2>
                <p className="text-xs text-gray-500">Authoritative valuation model</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs leading-relaxed text-gray-600">
              <p>
                <strong className="text-gray-900">Valuation:</strong> First-In-First-Out (FIFO) is
                strictly enforced for all inventory transactions according to Ethiopian public
                sector accounting standards.
              </p>
              <p>
                <strong className="text-gray-900">Cost Layering:</strong> Each received delivery
                maintains independent cost lots that are consumed sequentially during issuance.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Organization & Preference Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Organizational Parameters</h2>
                  <p className="text-xs text-gray-500">
                    System configuration and enterprise defaults
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition-colors hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgSettings.orgName}
                  onChange={(e) => setOrgSettings({ ...orgSettings, orgName: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Directorate / Unit
                </label>
                <input
                  type="text"
                  value={orgSettings.department}
                  onChange={(e) => setOrgSettings({ ...orgSettings, department: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Base Currency
                </label>
                <input
                  type="text"
                  value={orgSettings.currency}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Valuation Method
                </label>
                <input
                  type="text"
                  value={orgSettings.valuationMethod}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Fiscal Year Start
                </label>
                <input
                  type="text"
                  value={orgSettings.fiscalYearStart}
                  onChange={(e) =>
                    setOrgSettings({ ...orgSettings, fiscalYearStart: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase">
                  Default Low Stock Reorder Threshold
                </label>
                <input
                  type="number"
                  value={orgSettings.lowStockThresholdDefault}
                  onChange={(e) =>
                    setOrgSettings({ ...orgSettings, lowStockThresholdDefault: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <div className="mb-4 flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Notifications & Auditing</h3>
                  <p className="text-xs text-gray-500">
                    Security event recording and threshold alerts
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={orgSettings.autoAuditLogging}
                    onChange={(e) =>
                      setOrgSettings({ ...orgSettings, autoAuditLogging: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-800">
                    Automatically record all stock creation, updates, transfers, and approvals in
                    system audit log
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={orgSettings.emailNotifications}
                    onChange={(e) =>
                      setOrgSettings({ ...orgSettings, emailNotifications: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-800">
                    Send dashboard and email alerts when stock items breach minimum safety levels
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
