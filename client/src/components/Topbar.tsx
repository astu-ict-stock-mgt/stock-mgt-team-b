import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '../features/auth/hooks';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageMeta = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return { section: 'Overview', title: 'Operational Dashboard' };
      case '/inventory':
        return { section: 'Inventory', title: 'Stock & Inventory Catalog' };
      case '/stock-receiving':
        return { section: 'Receiving', title: 'Goods Receiving Notes (GRN)' };
      case '/stock-issuing':
        return { section: 'Issuing', title: 'Stock Issue Requisitions & Vouchers' };
      case '/stock-transfer':
        return { section: 'Transfer', title: 'Inter-Warehouse Stock Transfers' };
      case '/stock-taking':
        return { section: 'Audit & Count', title: 'Physical Stock Taking & Reconciliation' };
      case '/damaged-obsolete':
        return { section: 'Disposals', title: 'Damaged & Obsolete Items (Write-Off)' };
      case '/suppliers':
        return { section: 'Directory', title: 'Supplier Directory & Management' };
      case '/reports':
        return { section: 'Analytics', title: 'Inventory Valuation & Reports (FIFO)' };
      case '/users':
        return { section: 'Administration', title: 'User Management & Roles' };
      case '/roles':
        return { section: 'Administration', title: 'Roles & Permissions Matrix' };
      case '/audit-log':
        return { section: 'Security', title: 'System Activity & Audit Logs' };
      case '/settings':
        return { section: 'Settings', title: 'System Configuration & Preferences' };
      default:
        return { section: 'System', title: 'Stock Management Platform' };
    }
  };

  const { section, title } = getPageMeta(location.pathname);

  return (
    <header className="flex h-20 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-8">
      {/* Left: Hamburger (mobile) + Page Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Hamburger — only on mobile */}
        <button
          id="sidebar-toggle"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            {section}
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-gray-900 sm:text-2xl">{title}</h1>
        </div>
      </div>

      {/* Right: Search + Action Icons + Profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Global Search — hidden on very small screens */}
        <div className="relative hidden w-48 md:block lg:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-8 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Search catalog or records..."
            onChange={() => {}}
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button
            id="notifications-btn"
            onClick={() => navigate('/dashboard')}
            title="Notifications & Alerts"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            id="settings-btn"
            onClick={() => navigate('/settings')}
            title="System Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile */}
        <div
          onClick={() => navigate('/settings')}
          className="flex cursor-pointer items-center gap-3 border-l border-gray-200 pl-3 transition-opacity hover:opacity-80 sm:pl-6"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-700">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="hidden text-sm sm:block">
            <p className="leading-tight font-semibold text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : 'System User'}
            </p>
            <span className="py-0.2 inline-block rounded border border-blue-200 bg-blue-50 px-1.5 text-[10px] font-bold text-blue-700">
              {user?.role || 'STOREKEEPER'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
