import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Package,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { useStockAlerts } from '../hooks';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function LowStockTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<
    'severity' | 'currentQuantity' | 'shortageQuantity' | 'itemCode'
  >('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, refetch, isFetching } = useStockAlerts(
    {
      search: debouncedSearch,
      severity: selectedSeverity,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      warehouse: selectedWarehouse === 'ALL' ? undefined : selectedWarehouse,
      page: currentPage,
      pageSize,
    },
    {
      refetchInterval: 30000,
    }
  );

  const rawItems = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const criticalCount = data?.criticalCount ?? 0;
  const warningCount = data?.warningCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Client-side sort on loaded page
  const sortedItems = [...rawItems].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'severity') {
      const order = { CRITICAL: 0, WARNING: 1 };
      comparison = order[a.severity] - order[b.severity];
    } else if (sortBy === 'currentQuantity') {
      comparison = a.currentQuantity - b.currentQuantity;
    } else if (sortBy === 'shortageQuantity') {
      comparison = b.shortageQuantity - a.shortageQuantity;
    } else if (sortBy === 'itemCode') {
      comparison = a.itemCode.localeCompare(b.itemCode);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    if (sortedItems.length === 0) return;

    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Warehouse',
      'Current Quantity',
      'Safety Stock',
      'Reorder Level',
      'Shortage Quantity',
      'Severity',
      'Unit Cost (USD)',
    ];

    const rows = sortedItems.map((item) => [
      `"${item.itemCode}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.warehouse}"`,
      item.currentQuantity,
      item.safetyStock,
      item.reorderLevel,
      item.shortageQuantity,
      item.severity,
      item.unitCost.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `low_stock_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Filter and Search Bar Card */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, item name, category, warehouse..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="hidden h-4 w-4 text-gray-400 sm:inline" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
                aria-label="Filter by category"
              >
                <option value="ALL">All Categories</option>
                {Array.from(new Set(rawItems.map((i) => i.category).filter(Boolean))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
              aria-label="Filter by warehouse"
            >
              <option value="ALL">All Warehouses</option>
              {Array.from(new Set(rawItems.map((i) => i.warehouse).filter(Boolean))).map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={sortedItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 disabled:opacity-50"
              title="Refresh table data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Filter by Severity:</span>
            <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('ALL');
                  setCurrentPage(1);
                }}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  selectedSeverity === 'ALL'
                    ? 'bg-white font-bold text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Alerts ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('CRITICAL');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
                  selectedSeverity === 'CRITICAL'
                    ? 'bg-red-600 font-bold text-white shadow-xs'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Critical ({criticalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('WARNING');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
                  selectedSeverity === 'WARNING'
                    ? 'bg-amber-500 font-bold text-white shadow-xs'
                    : 'text-amber-600 hover:bg-amber-50'
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                Warning ({warningCount})
              </button>
            </div>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700"
              aria-label="Items per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-600 uppercase">
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3.5 hover:text-gray-900"
                  onClick={() => toggleSort('severity')}
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3.5 hover:text-gray-900"
                  onClick={() => toggleSort('itemCode')}
                >
                  <div className="flex items-center gap-1">
                    <span>Item Code & Name</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="hidden px-4 py-3.5 md:table-cell">
                  Category
                </th>
                <th scope="col" className="hidden px-4 py-3.5 lg:table-cell">
                  Warehouse Location
                </th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3.5 text-center hover:text-gray-900"
                  onClick={() => toggleSort('currentQuantity')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Current Stock</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="hidden px-4 py-3.5 text-center sm:table-cell">
                  Safety Stock
                </th>
                <th scope="col" className="hidden px-4 py-3.5 text-center sm:table-cell">
                  Reorder Level
                </th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3.5 text-right hover:text-gray-900"
                  onClick={() => toggleSort('shortageQuantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Shortage Deficit</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">
                        Loading stock monitoring alerts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                      <p className="text-sm font-semibold text-gray-900">
                        Failed to load monitoring data
                      </p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-gray-900">
                        No stock alerts found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {searchTerm || selectedSeverity !== 'ALL'
                          ? 'Try adjusting your filters or search terms.'
                          : 'All inventory items are stocked above their reorder thresholds.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const isCritical: boolean = item.severity === 'CRITICAL';
                  const stockPct = Math.min(
                    100,
                    Math.max(0, Math.round((item.currentQuantity / (item.reorderLevel || 1)) * 100))
                  );

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-gray-50/70 ${
                        isCritical ? 'bg-red-50/15' : 'bg-amber-50/10'
                      }`}
                    >
                      {/* Severity Pill */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isCritical
                              ? 'border border-red-200 bg-red-100 text-red-800'
                              : 'border border-amber-200 bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCritical ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                              <span>
                                {item.status === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'CRITICAL'}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                              <span>REORDER</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Item Code & Name with Link to Inventory Detail */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <Link
                            to={`/inventory?itemCode=${encodeURIComponent(item.itemCode)}`}
                            className="group inline-flex items-center gap-1.5 font-bold text-gray-900 hover:text-blue-600 hover:underline"
                            title={`View item details for ${item.itemCode}`}
                          >
                            <span>{item.itemCode}</span>
                            <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                          <span className="line-clamp-1 text-xs font-medium text-gray-600">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="hidden px-4 py-3.5 whitespace-nowrap md:table-cell">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Warehouse */}
                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <div className="text-xs">
                          <p className="font-semibold text-gray-800">{item.warehouse}</p>
                          {item.warehouseLocation && (
                            <p className="text-[11px] text-gray-400">{item.warehouseLocation}</p>
                          )}
                        </div>
                      </td>

                      {/* Current Stock + Gauge */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-extrabold ${
                              isCritical ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            {item.currentQuantity} {item.unit}
                          </span>
                          <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                isCritical ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Safety Stock */}
                      <td className="hidden px-4 py-3.5 text-center font-medium whitespace-nowrap text-gray-700 sm:table-cell">
                        {item.safetyStock} {item.unit}
                      </td>

                      {/* Reorder Level */}
                      <td className="hidden px-4 py-3.5 text-center font-medium whitespace-nowrap text-gray-700 sm:table-cell">
                        {item.reorderLevel} {item.unit}
                      </td>

                      {/* Shortage Deficit */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                            isCritical ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          -{item.shortageQuantity} {item.unit}
                        </span>
                      </td>

                      {/* Action Link */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/inventory?itemCode=${encodeURIComponent(item.itemCode)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span>Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-600 sm:flex-row sm:px-6">
          <div>
            Showing <span className="font-bold text-gray-900">{sortedItems.length}</span> of{' '}
            <span className="font-bold text-gray-900">{totalCount}</span> alerted items (Page{' '}
            <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-bold text-gray-900">{totalPages}</span>)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
