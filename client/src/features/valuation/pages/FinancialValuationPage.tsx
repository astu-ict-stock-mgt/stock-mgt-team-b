import { useState } from 'react';
import {
  Calculator,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  BookOpen,
  FileCheck,
  PieChart,
} from 'lucide-react';
import {
  useFinancialSummary,
  useCostLayers,
  useFinancialLedger,
  useFiscalStatement,
} from '../hooks';
import { FinancialSummaryCards } from '../components/FinancialSummaryCards';
import { CostLayersInspectionTable } from '../components/CostLayersInspectionTable';
import { GeneralLedgerCostingTable } from '../components/GeneralLedgerCostingTable';
import { FiscalValuationStatement } from '../components/FiscalValuationStatement';
import type { ValuationFilterState } from '../types';

export function FinancialValuationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'layers' | 'ledger' | 'statement'>(
    'overview'
  );
  const [filters, setFilters] = useState<ValuationFilterState>({
    search: '',
    state: 'active',
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useFinancialSummary(filters);
  const {
    data: costLayers,
    isLoading: layersLoading,
    refetch: refetchLayers,
  } = useCostLayers(filters);
  const {
    data: ledger,
    isLoading: ledgerLoading,
    refetch: refetchLedger,
  } = useFinancialLedger(filters);
  const {
    data: statement,
    isLoading: statementLoading,
    refetch: refetchStatement,
  } = useFiscalStatement(filters);

  const handleRefresh = () => {
    refetchSummary();
    refetchLayers();
    refetchLedger();
    refetchStatement();
  };

  const isAnyLoading = summaryLoading || layersLoading || ledgerLoading || statementLoading;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Workspace Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 sm:text-2xl">
                  Financial Valuation & Costing
                </h1>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  Accountant Workspace
                </span>
              </div>
              <p className="text-xs text-gray-500">
                FIFO inventory asset valuation, cost layer aging analysis, and general ledger
                reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isAnyLoading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnyLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Executive KPI Summary Cards */}
        <FinancialSummaryCards summary={summary} loading={summaryLoading} />

        {/* Global Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, lot IDs, accounts, or reference numbers..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pr-4 pl-10 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="bg-transparent text-xs text-gray-700 focus:outline-none"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="bg-transparent text-xs text-gray-700 focus:outline-none"
              />
            </div>

            {(filters.search || filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                onClick={() => setFilters({ search: '', state: 'active' })}
                className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-2xl border-b border-gray-200 bg-white px-3 py-2 shadow-xs">
          <nav className="flex space-x-2 overflow-x-auto pb-1 text-xs font-semibold sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <PieChart className="h-4 w-4" />
              Overview & Distribution
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layers')}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all ${
                activeTab === 'layers'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              FIFO Cost Layers
              {costLayers?.lots.length !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === 'layers'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {costLayers.lots.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Costing Ledger (Journal)
              {ledger?.entries.length !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === 'ledger'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {ledger.entries.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all ${
                activeTab === 'statement'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              Fiscal Valuation Statement
            </button>
          </nav>
        </div>

        {/* Tab Content Views */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <CostLayersInspectionTable
                data={costLayers}
                loading={layersLoading}
                searchQuery={filters.search || ''}
              />
              <GeneralLedgerCostingTable
                data={ledger}
                loading={ledgerLoading}
                searchQuery={filters.search || ''}
              />
            </div>
          )}

          {activeTab === 'layers' && (
            <CostLayersInspectionTable
              data={costLayers}
              loading={layersLoading}
              searchQuery={filters.search || ''}
            />
          )}

          {activeTab === 'ledger' && (
            <GeneralLedgerCostingTable
              data={ledger}
              loading={ledgerLoading}
              searchQuery={filters.search || ''}
            />
          )}

          {activeTab === 'statement' && (
            <FiscalValuationStatement data={statement} loading={statementLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialValuationPage;
