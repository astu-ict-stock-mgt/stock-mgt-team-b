import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  PackageCheck,
  ClipboardList,
  ArrowLeftRight,
  ClipboardCheck,
  AlertOctagon,
  Truck,
  FileText,
  Activity,
  Settings,
  ShieldCheck,
  Calculator,
  User as UserIcon,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks';
import type { Role } from '../features/users/types';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', path: '/inventory', icon: Package },
  {
    name: 'Stock Receiving',
    path: '/stock-receiving',
    icon: PackageCheck,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'],
  },
  {
    name: 'Stock Issuing',
    path: '/stock-issuing',
    icon: ClipboardList,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'DEPARTMENT_HEAD'],
  },
  {
    name: 'Stock Transfer',
    path: '/stock-transfer',
    icon: ArrowLeftRight,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'],
  },
  {
    name: 'Gate Clearance',
    path: '/gate-pass',
    icon: ShieldCheck,
    allowedRoles: ['SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR'],
  },
  {
    name: 'Stock Taking',
    path: '/stock-taking',
    icon: ClipboardCheck,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK', 'ACCOUNTANT'],
  },
  {
    name: 'Damaged & Obsolete',
    path: '/damaged-obsolete',
    icon: AlertOctagon,
    allowedRoles: [
      'ADMINISTRATOR',
      'PAO',
      'STOREKEEPER',
      'STOCK_CLERK',
      'DEPARTMENT_HEAD',
      'ACCOUNTANT',
    ],
  },
  {
    name: 'Suppliers',
    path: '/suppliers',
    icon: Truck,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'],
  },
  {
    name: 'Financial Valuation',
    path: '/finance',
    icon: Calculator,
    allowedRoles: ['ACCOUNTANT', 'PAO', 'ADMINISTRATOR'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: FileText,
    allowedRoles: [
      'ADMINISTRATOR',
      'PAO',
      'STOREKEEPER',
      'STOCK_CLERK',
      'ACCOUNTANT',
      'DEPARTMENT_HEAD',
    ],
  },
  {
    name: 'Audit Logs',
    path: '/audit-log',
    icon: Activity,
    allowedRoles: ['ADMINISTRATOR', 'PAO', 'ACCOUNTANT'],
  },
  {
    name: 'Users',
    path: '/users',
    icon: Users,
    allowedRoles: ['ADMINISTRATOR', 'PAO'],
  },
  {
    name: 'Roles & Permissions',
    path: '/roles',
    icon: UserCog,
    allowedRoles: ['ADMINISTRATOR', 'PAO'],
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    allowedRoles: ['ADMINISTRATOR'],
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const userRole = user?.role as Role | undefined;
  const filteredNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole);
  });

  return (
    <div className="flex h-full w-64 flex-col bg-[#0b1120] text-gray-300">
      {/* Logo Area */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <img src="/astu-logo.png" alt="ASMS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white">ASMS</h1>
            <p className="text-[10px] text-gray-400">ASTU Stock Management</p>
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
              <UserIcon className="h-5 w-5 text-gray-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'System User'}
              </p>
              <p className="truncate text-xs text-gray-400">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-950/60 hover:text-red-400"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
