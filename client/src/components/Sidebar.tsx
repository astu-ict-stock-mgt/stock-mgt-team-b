import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  Truck,
  FileText,
  Activity,
  Settings,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Roles & Permissions', path: '/roles', icon: UserCog },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Audit Logs', path: '/audit-log', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-[#0b1120] text-gray-300">
      {/* Logo Area */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white">STOCKFLOW</h1>
            <p className="text-[10px] text-gray-400">Enterprise Core</p>
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
        {navItems.map((item) => (
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

      {/* User Profile */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
            <UserIcon className="h-6 w-6 text-gray-300" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || 'Marcus Vance'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {user?.role === 'PAO' ? 'Super Admin' : user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
