import { useState } from 'react';
import { useAuditLogs } from '../hooks';
import { CustomDatePicker } from '../../../components/CustomDatePicker';

const PAGE_SIZE = 8;

function getActionBadgeColor(action: string) {
  switch (action) {
    case 'CREATED':
      return 'bg-green-100 text-green-600';
    case 'UPDATED':
      return 'bg-blue-100 text-blue-600';
    case 'DELETED':
      return 'bg-red-100 text-red-500';
    case 'LOGIN':
    case 'LOGOUT':
      return 'bg-purple-100 text-purple-500';
    case 'APPROVED':
      return 'bg-green-100 text-green-600';
    case 'REJECTED':
      return 'bg-orange-100 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// Helper to format date as "YYYY-MM-DD hh:mm AM/PM"
function formatTimestamp(isoString: string) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');

  return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
}

export function AuditLogTable() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedAction, setSelectedAction] = useState('All');

  // These are the actual applied filters
  const [filters, setFilters] = useState({
    user: 'All Users',
    action: 'All',
    date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError } = useAuditLogs(filters, currentPage, PAGE_SIZE);

  const logs = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const distinctUsers = data?.distinctUsers ?? [];
  const distinctActions = data?.distinctActions ?? [];

  const handleSearch = () => {
    setFilters({
      user: selectedUser,
      action: selectedAction,
      date: selectedDate,
    });
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Build page numbers to display
  const pageNumbers: number[] = [];
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="w-full space-y-6">
      {/* Filters Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col flex-wrap gap-4 md:flex-row md:items-center">
            {/* Custom Date Picker */}
            <CustomDatePicker value={selectedDate} onChange={setSelectedDate} />

            {/* All Users */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="block w-full rounded-md border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none md:w-48"
            >
              <option value="All Users">All Users</option>
              {distinctUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>

            {/* Action */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="block w-full rounded-md border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none md:w-48"
            >
              <option value="All">Action: All</option>
              {distinctActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="w-full rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none md:w-auto"
          >
            Search Log
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-4 text-xs font-semibold text-gray-500">Timestamp</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500">User</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500">Action</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500">Module</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500">Description</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Loading audit logs...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-red-500">
                    Failed to load audit logs. Please try again.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`${index !== logs.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-600">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold whitespace-nowrap text-gray-900">
                      {log.userName}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
                      {log.entity}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{log.description || 'N/A'}</td>
                    <td className="px-4 py-4 text-right text-sm whitespace-nowrap text-gray-400">
                      {log.ipAddress || 'localhost'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} entries
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                  page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
