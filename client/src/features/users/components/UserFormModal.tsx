import React, { useState } from 'react';
import { X, AlertCircle, Eye, EyeOff, UserCheck, ShieldCheck } from 'lucide-react';
import { useCreateUser, useUpdateUser } from '../hooks';
import { ApiError } from '../api';
import type { User, CreateUserDto, Role, UserStatus } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

export const SRS_ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'ADMINISTRATOR',
    label: 'Administrator',
    description: 'Full system configuration, user management, and security logs',
  },
  {
    value: 'PAO',
    label: 'Property Administration Officer (PAO)',
    description: 'Supervises inventory, approves transfers, and oversees stock taking',
  },
  {
    value: 'STOREKEEPER',
    label: 'Storekeeper',
    description: 'Receives, stores, issues items, and maintains bin cards',
  },
  {
    value: 'STOCK_CLERK',
    label: 'Stock Clerk',
    description: 'Records inventory transactions and assists storekeeping',
  },
  {
    value: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'Monitors financial valuations (FIFO) and financial reports',
  },
  {
    value: 'DEPARTMENT_HEAD',
    label: 'Department Head',
    description: 'Approves department requisitions and monitors departmental stock',
  },
  {
    value: 'SECURITY_OFFICER',
    label: 'Security Officer',
    description: 'Controls premises entry/dispatch and verifies gate passes',
  },
];

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  general?: string;
}

function UserFormInner({ isOpen, onClose, userToEdit }: UserFormModalProps) {
  const isEditMode = Boolean(userToEdit);
  const { mutateAsync: createUser, isPending: isCreating } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const isPending = isCreating || isUpdating;

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    department: string;
    password: string;
    status: UserStatus;
  }>({
    firstName: userToEdit?.firstName || '',
    lastName: userToEdit?.lastName || '',
    email: userToEdit?.email || '',
    role: userToEdit?.role || 'STOCK_CLERK',
    department: userToEdit?.department || '',
    password: '',
    status: userToEdit?.status ?? 'ACTIVE',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g. user@astu.edu.et).';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Please select a system role.';
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Temporary password is required for new users.';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long.';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'New password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear inline error on field change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (isEditMode && userToEdit) {
        await updateUser({
          id: userToEdit.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            status: formData.status,
            ...(formData.password ? { password: formData.password } : {}),
          },
        });
      } else {
        const payload: CreateUserDto = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          status: formData.status,
          password: formData.password,
        };
        await createUser(payload);
      }

      onClose();
    } catch (err: unknown) {
      const axiosMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const message =
        axiosMsg ||
        (err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please check network connection.');

      if (
        message.toLowerCase().includes('email') ||
        message.toLowerCase().includes('already exists')
      ) {
        setErrors((prev) => ({
          ...prev,
          email: message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: message,
        }));
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="user-modal-title" className="text-lg font-bold text-gray-900">
                {isEditMode ? 'Edit User Account' : 'Create New System User'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditMode
                  ? 'Update credentials, department, and role permissions'
                  : 'Assign user credentials and RBAC access level'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* General API Error Banner */}
          {errors.general && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Name Fields Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="e.g. Almaz"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:ring-2 focus:outline-none ${
                    errors.firstName
                      ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="e.g. Bekele"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:ring-2 focus:outline-none ${
                    errors.lastName
                      ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field with Inline Error Support */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="user@astu.edu.et"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:ring-2 focus:outline-none ${
                  errors.email
                    ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.email && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Role Selection (7 SRS Roles) */}
            <div>
              <label
                htmlFor="role"
                className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
              >
                System Role (RBAC) <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                {SRS_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                {SRS_ROLES.find((r) => r.value === formData.role)?.description}
              </p>
            </div>

            {/* Department & Status Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="department"
                  className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
                >
                  Department / Office
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  placeholder="e.g. Central Store, CSE"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
                >
                  Account Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                >
                  <option value="ACTIVE">Active (Can log in)</option>
                  <option value="INACTIVE">Inactive (Suspended)</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wider text-gray-700 uppercase"
              >
                {isEditMode
                  ? 'Change Password (leave empty to keep current)'
                  : 'Temporary Password'}{' '}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder={isEditMode ? '••••••••' : 'Min. 6 characters'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm transition focus:ring-2 focus:outline-none ${
                    errors.password
                      ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              {isPending
                ? isEditMode
                  ? 'Saving Changes...'
                  : 'Creating Account...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserFormModal({ isOpen, onClose, userToEdit }: UserFormModalProps) {
  if (!isOpen) return null;
  return (
    <UserFormInner
      key={userToEdit ? userToEdit.id : 'create-new-user'}
      isOpen={isOpen}
      onClose={onClose}
      userToEdit={userToEdit}
    />
  );
}
