import { Link } from 'react-router-dom';
import { Users, ShieldAlert, ShieldCheck, UserCheck, UserX, LayoutDashboard } from 'lucide-react';
import { useAuth, type Role } from '../../auth/hooks';
import { UserTable } from '../components/UserTable';
import { useGetUsers } from '../hooks';

export function UsersPage() {
  const { user, setRole } = useAuth();
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const { data } = useGetUsers();
  const allUsers = data?.data ?? [];
  const totalUsers = data?.totalCount ?? allUsers.length;
  const activeCount = allUsers.filter((u) => u.status === 'ACTIVE').length;
  const inactiveCount = allUsers.filter((u) => u.status === 'INACTIVE').length;

  // 403 Forbidden Screen for non-Administrator users
  if (!isAdmin) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-red-500/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-bold tracking-wider text-red-700 uppercase">
            HTTP 403 — Forbidden
          </span>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">Access Denied</h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            User management is strictly restricted to users with the{' '}
            <strong className="font-semibold text-gray-900">ADMINISTRATOR</strong> role (SRS Section
            4.4.8). Your current assigned role is{' '}
            <span className="font-mono font-bold text-red-600">{user?.role}</span>.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <button
              onClick={() => setRole('ADMINISTRATOR')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Switch to Administrator (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Administrator View
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              Admin Only
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage, and configure system accounts and role-based permissions across the
            organization.
          </p>
        </div>

        {/* Demo Role Switcher to test 403 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Viewing as:</span>
          <select
            aria-label="Simulate User Role"
            value={user?.role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-semibold text-gray-800 shadow-2xs focus:border-blue-500 focus:outline-none"
          >
            <option value="ADMINISTRATOR">ADMINISTRATOR (Full Access)</option>
            <option value="PAO">PAO (Test 403)</option>
            <option value="STOREKEEPER">STOREKEEPER (Test 403)</option>
            <option value="STOCK_CLERK">STOCK_CLERK (Test 403)</option>
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Total Accounts
            </p>
            <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Active Users
            </p>
            <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Inactive / Suspended
            </p>
            <h3 className="text-2xl font-bold text-gray-900">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* Main User Table Feature */}
      <UserTable />
    </div>
  );
}

export default UsersPage;
