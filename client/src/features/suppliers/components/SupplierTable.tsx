import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, Plus } from 'lucide-react';
import { useSuppliers, useDeleteSupplier, useUpdateSupplier } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { SupplierFormModal } from './SupplierFormModal';
import type { Supplier } from '../types';

const PAGE_SIZE = 5;

export function SupplierTable() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search — reset to page 1 on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading, isError } = useSuppliers(debouncedSearch);
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier();
  const { mutate: updateSupplier } = useUpdateSupplier();

  const allSuppliers = data ?? [];
  const totalCount = allSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const suppliers = allSuppliers.slice(startIndex, startIndex + PAGE_SIZE);

  const canManageSuppliers = user?.role === 'PAO' || user?.role === 'ADMINISTRATOR';

  const handleAddNew = () => {
    setSupplierToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')
    ) {
      deleteSupplier(id);
    }
    setOpenDropdown(null);
  };

  const handleToggleStatus = (supplier: Supplier) => {
    updateSupplier({
      id: supplier.id,
      data: { isActive: !supplier.isActive },
    });
    setOpenDropdown(null);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Build page numbers to display
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
            </div>
            <input
              type="text"
              id="supplier-search"
              className="block w-full rounded-md border border-gray-200 bg-gray-50 py-2.5 pr-3 pl-8 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Search registered suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canManageSuppliers && (
            <button
              id="add-supplier-btn"
              onClick={handleAddNew}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Supplier ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Company Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Contact Person
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Business Phone
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Contact Email
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  Status
                </th>
                {canManageSuppliers && (
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={canManageSuppliers ? 7 : 6}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span>Loading suppliers...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={canManageSuppliers ? 7 : 6}
                    className="py-8 text-center text-sm text-red-500"
                  >
                    Failed to load suppliers. Please try again.
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageSuppliers ? 7 : 6}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-blue-600">
                      {supplier.id.split('-')[0]}...
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {supplier.contactName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {supplier.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManageSuppliers && (
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <div
                          className="relative inline-block text-left"
                          ref={openDropdown === supplier.id ? dropdownRef : null}
                        >
                          <button
                            id={`action-btn-${supplier.id}`}
                            onClick={() =>
                              setOpenDropdown(openDropdown === supplier.id ? null : supplier.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {openDropdown === supplier.id && (
                            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md border border-gray-100 bg-white shadow-lg">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Pencil className="h-4 w-4 text-gray-400" />
                                  Edit Supplier
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(supplier)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                                  {supplier.isActive ? 'Set Inactive' : 'Set Active'}
                                </button>
                                <button
                                  onClick={() => handleDelete(supplier.id)}
                                  disabled={isDeleting}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Supplier
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium">
              {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>
            {' – '}
            <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span>
            {' of '}
            <span className="font-medium">{totalCount}</span> entries
          </p>

          <div className="flex items-center gap-1">
            <button
              id="pagination-prev"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                id={`pagination-page-${page}`}
                onClick={() => goToPage(page)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              id="pagination-next"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplierToEdit={supplierToEdit}
      />
    </div>
  );
}
