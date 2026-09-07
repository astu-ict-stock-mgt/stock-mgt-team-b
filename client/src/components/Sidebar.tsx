import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  PackagePlus,
  Truck,
  FileText,
  Activity,
  Settings,
  User as UserIcon,
  X,
  ClipboardList,
  ArrowLeftRight,
  ClipboardCheck,
  Trash2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks';
import { Role } from '../features/users/types';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: Role[];
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || 'STOREKEEPER') as Role;

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'SECURITY_OFFICER',
      ],
    },
    {
      name: 'Inventory Catalog',
      path: '/inventory',
      icon: Package,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'SECURITY_OFFICER',
      ],
    },
    {
      name: 'Stock Receiving (GRN)',
      path: '/stock-receiving',
      icon: PackagePlus,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'],
    },
    {
      name: 'Stock Issuing (SIV)',
      path: '/stock-issuing',
      icon: ClipboardList,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'SECURITY_OFFICER',
      ],
    },
    {
      name: 'Stock Transfers',
      path: '/stock-transfer',
      icon: ArrowLeftRight,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'],
    },
    {
      name: 'Physical Stock Taking',
      path: '/stock-taking',
      icon: ClipboardCheck,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK', 'ACCOUNTANT'],
    },
    {
      name: 'Damaged & Obsolete',
      path: '/damaged-obsolete',
      icon: Trash2,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK', 'ACCOUNTANT'],
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: Truck,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK', 'ACCOUNTANT'],
    },
    {
      name: 'Valuation & Reports',
      path: '/reports',
      icon: FileText,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'ACCOUNTANT',
        'STOREKEEPER',
        'STOCK_CLERK',
        'DEPARTMENT_HEAD',
      ],
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
      allowedRoles: ['ADMINISTRATOR', 'PAO'],
    },
    {
      name: 'Roles & Matrix',
      path: '/roles',
      icon: UserCog,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'SECURITY_OFFICER',
      ],
    },
    {
      name: 'Audit Logs',
      path: '/audit-log',
      icon: Activity,
      allowedRoles: ['ADMINISTRATOR', 'PAO', 'ACCOUNTANT'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      allowedRoles: [
        'ADMINISTRATOR',
        'PAO',
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'SECURITY_OFFICER',
      ],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles ? item.allowedRoles.includes(userRole) : true
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-[#0b1120] text-gray-300">
      {/* Logo Area */}
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white">STOCKFLOW</h1>
            <p className="text-[10px] font-medium text-blue-400">ASTU ICT Inventory</p>
          </div>
        </div>
        {/* Close button — only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 font-semibold text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-100'
              }`
            }
          >
            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Sign Out */}
      <div className="border-t border-gray-800/80 p-3">
        <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/90 p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/30 text-blue-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'System User'}
              </p>
              <span className="inline-block truncate text-[10px] font-semibold text-blue-400">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of system"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
