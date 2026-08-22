import { AuditLogTable } from '../components/AuditLogTable';
import { ChevronRight } from 'lucide-react';

export function AuditLogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-2 flex text-sm text-gray-400" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <a href="#" className="hover:text-gray-600">
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <a href="#" className="ml-1 hover:text-gray-600 md:ml-2">
                Audit Center
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="ml-1 font-medium text-gray-800 md:ml-2">Logs</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Audit & Activity Log</h1>
      </div>

      <AuditLogTable />
    </div>
  );
}

export default AuditLogPage;
