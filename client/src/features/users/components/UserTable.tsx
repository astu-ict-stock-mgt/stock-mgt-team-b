import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserX,
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useGetUsers, useDeleteUser, useToggleUserStatus } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { UserFormModal, SRS_ROLES } from './UserFormModal';
import type { User, Role, UserStatus } from '../types';

const PAGE_SIZE = 6;

// Helper to format role names into clean badges
export function getRoleBadge(role: Role) {
  switch (role) {
    case 'ADMINISTRATOR':
      return {
        label: 'Administrator',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'PAO':
      return {
        label: 'PAO Officer',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'STOREKEEPER':
      return {
        label: 'Storekeeper',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'STOCK_CLERK':
      return {
        label: 'Stock Clerk',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'ACCOUNTANT':
      return {
        label: 'Accountant',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'DEPARTMENT_HEAD':
      return {
        label: 'Dept Head',
        bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        dot: 'bg-cyan-500',
      };
    case 'SECURITY_OFFICER':
      return {
        label: 'Security Officer',
        bg: 'bg-slate-100 text-slate-800 border-slate-300',
        dot: 'bg-slate-500',
      };
    default:
      return {
        label: role,
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
        dot: 'bg-gray-400',
      };
  }
}

// Generate color from user name for initials avatar
function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { user: currentUser } = useAuth();
  const { data, isLoading, isError, refetch } = useGetUsers({
    search: debouncedSearch,
    role: selectedRole,
    status: selectedStatus,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: toggleStatus } = useToggleUserStatus();

  const users = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleAddNew = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleDelete = (user: User) => {
    if (currentUser && currentUser.id === user.id) {
      setFeedback({
        type: 'error',
        message: 'You cannot deactivate your own active administrator account.',
      });
      setActiveDropdownId(null);
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to deactivate user account "${user.firstName} ${user.lastName}" (${user.email})?`
      )
    ) {
      deleteUser(user.id, {
        onSuccess: () => {
          setFeedback({
            type: 'success',
            message: `User account "${user.firstName} ${user.lastName}" was deactivated successfully.`,
          });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to deactivate user account.';
          setFeedback({
            type: 'error',
            message: msg,
          });
        },
      });
    }
    setActiveDropdownId(null);
  };

  const handleToggle = (user: User) => {
    if (currentUser && currentUser.id === user.id && user.status === 'ACTIVE') {
      setFeedback({
        type: 'error',
        message: 'You cannot deactivate your own active administrator account.',
      });
      setActiveDropdownId(null);
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'deactivated' : 'activated';
    toggleStatus(user, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          message: `User "${user.firstName} ${user.lastName}" ${nextStatus} successfully.`,
        });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to update user status.';
        setFeedback({
          type: 'error',
          message: msg,
        });
      },
    });
    setActiveDropdownId(null);
  };

  const handleRoleFilterChange = (role: Role | '') => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: UserStatus | '') => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedRole('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Notification / Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-700"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Filter and Actions Bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pr-4 pl-10 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                aria-label="Filter by System Role"
                value={selectedRole}
                onChange={(e) => handleRoleFilterChange(e.target.value as Role | '')}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                <option value="">All Roles (7)</option>
                {SRS_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              aria-label="Filter by Account Status"
              value={selectedStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value as UserStatus | '')}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {(debouncedSearch || selectedRole || selectedStatus) && (
              <button
                onClick={clearFilters}
                className="px-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Reset
              </button>
            )}

            {/* Add User CTA Button */}
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <th scope="col" className="px-6 py-4">
                  User Details
                </th>
                <th scope="col" className="px-6 py-4">
                  System Role
                </th>
                <th scope="col" className="px-6 py-4">
                  Department
                </th>
                <th scope="col" className="px-6 py-4">
                  Status
                </th>
                <th scope="col" className="px-6 py-4">
                  Registered Date
                </th>
                <th scope="col" className="px-6 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 rounded-sm bg-gray-200" />
                          <div className="h-3 w-40 rounded-sm bg-gray-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 rounded-md bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded-sm bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 rounded-full bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 rounded-sm bg-gray-100" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto h-8 w-8 rounded-lg bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                    <p className="font-medium">Failed to load users from the server.</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-xs font-semibold text-blue-600 underline hover:text-blue-800"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <UserX className="h-7 w-7" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-gray-800">No users found</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {debouncedSearch || selectedRole || selectedStatus
                        ? 'No system users match your current search or filter criteria.'
                        : 'No user accounts registered in the database yet.'}
                    </p>
                    {debouncedSearch || selectedRole || selectedStatus ? (
                      <button
                        onClick={clearFilters}
                        className="mt-4 inline-flex items-center rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={handleAddNew}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" /> Create First User
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const avatarColor = getAvatarColor(`${user.firstName} ${user.lastName}`);
                  const initials =
                    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
                  const isDropdownOpen = activeDropdownId === user.id;

                  return (
                    <tr key={user.id} className="transition duration-150 hover:bg-blue-50/30">
                      {/* User Avatar + Name + Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="h-3 w-3 shrink-0 text-gray-400" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${roleBadge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`} />
                          <Shield className="h-3 w-3" />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span>{user.department || 'General Organization'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === 'ACTIVE'
                              ? 'border border-green-200 bg-green-50 text-green-700'
                              : 'border border-gray-200 bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'animate-pulse bg-green-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Action Dropdown Menu */}
                      <td className="px-6 py-4 text-right">
                        <div
                          className="relative inline-block text-left"
                          ref={isDropdownOpen ? dropdownRef : null}
                        >
                          <button
                            onClick={() => setActiveDropdownId(isDropdownOpen ? null : user.id)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none">
                              <button
                                onClick={() => handleEdit(user)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                Edit Details
                              </button>

                              <button
                                onClick={() => handleToggle(user)}
                                disabled={currentUser?.id === user.id && user.status === 'ACTIVE'}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {user.status === 'ACTIVE' ? (
                                  <>
                                    <ToggleLeft className="h-3.5 w-3.5 text-amber-600" />
                                    Deactivate User
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                                    Activate User
                                  </>
                                )}
                              </button>

                              <div className="my-1 border-t border-gray-100" />

                              <button
                                onClick={() => handleDelete(user)}
                                disabled={currentUser?.id === user.id}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title={
                                  currentUser?.id === user.id
                                    ? 'Cannot delete your own account'
                                    : 'Delete Account'
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Account
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!isLoading && users.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-6 py-4 sm:flex-row">
            <p className="text-xs text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * PAGE_SIZE, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{totalCount}</span> registered users
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
      />
    </div>
  );
}
