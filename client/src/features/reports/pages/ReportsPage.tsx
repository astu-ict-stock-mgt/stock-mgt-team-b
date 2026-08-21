import { useState } from 'react';
import { useReportsData } from '../hooks';
import type { ReportType } from '../types';
import { ReportsHeader } from '../components/ReportsHeader';
import { ReportSummaryCards } from '../components/ReportSummaryCards';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { StockMovementTable } from '../components/StockMovementTable';
import { ReceivingReportTable } from '../components/ReceivingReportTable';
import { IssuingReportTable } from '../components/IssuingReportTable';
import { ValuationReportTable } from '../components/ValuationReportTable';
import { SupplierReportTable } from '../components/SupplierReportTable';
import { StockStatusReportTable } from '../components/StockStatusReportTable';
import { GeneratedReportsHistory } from '../components/GeneratedReportsHistory';
import { ReportExportModal } from '../components/ReportExportModal';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    filters,
    updateFilter,
    resetFilters,
    loading,
    refresh,
    summary,
    stockMovement,
    receiving,
    issuing,
    valuation,
    suppliers,
    stockStatus,
    history,
    exportCsv,
    saveReport,
  } = useReportsData();

  const tabs: { id: ReportType; label: string; count?: number } = [
    { id: 'overview', label: 'Dashboard Overview' },
    {
      id: 'stock-movement',
      label: 'Stock Movement',
      count: stockMovement?.transactions.length,
    },
    { id: 'valuation', label: 'FIFO Valuation', count: valuation?.items.length },
    { id: 'receiving', label: 'Goods Receiving', count: receiving?.transactions.length },
    { id: 'issuing', label: 'Stock Issues', count: issuing?.transactions.length },
    { id: 'suppliers', label: 'Supplier Deliveries', count: suppliers?.suppliers.length },
    {
      id: 'stock-status',
      label: 'Stock Health & Alerts',
      count: stockStatus?.summary.lowStockItemsCount,
    },
    { id: 'history', label: 'Archive & History', count: history.length },
  ] as any;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <ReportsHeader
        onOpenExport={() => setIsExportModalOpen(true)}
        onPrint={() => window.print()}
        onRefresh={refresh}
        loading={loading}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6 sm:px-6 lg:px-8">
        {/* KPI Summary Cards */}
        <ReportSummaryCards summary={summary} loading={loading} />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white px-3 py-2 rounded-2xl shadow-xs">
          <nav className="flex space-x-2 overflow-x-auto pb-1 text-xs font-semibold sm:text-sm">
            {tabs.map((tab: any) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters Bar (Only relevant for ledger/table views) */}
        {activeTab !== 'history' && (
          <ReportFiltersBar
            filters={filters}
            onUpdateFilter={updateFilter}
            onReset={resetFilters}
          />
        )}

        {/* Active Tab View */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <ValuationReportTable
                data={valuation}
                loading={loading}
                searchQuery={filters.search}
              />
              <StockMovementTable
                data={stockMovement}
                loading={loading}
                searchQuery={filters.search}
              />
            </div>
          )}

          {activeTab === 'stock-movement' && (
            <StockMovementTable
              data={stockMovement}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'valuation' && (
            <ValuationReportTable
              data={valuation}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'receiving' && (
            <ReceivingReportTable
              data={receiving}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'issuing' && (
            <IssuingReportTable
              data={issuing}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierReportTable
              data={suppliers}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'stock-status' && (
            <StockStatusReportTable
              data={stockStatus}
              loading={loading}
              searchQuery={filters.search}
            />
          )}

          {activeTab === 'history' && (
            <GeneratedReportsHistory
              history={history}
              loading={loading}
              onExportCsv={exportCsv}
            />
          )}
        </div>
      </div>

      {/* Export & Archive Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        onExportCsv={exportCsv}
        onSaveReport={saveReport}
      />
    </div>
  );
}
