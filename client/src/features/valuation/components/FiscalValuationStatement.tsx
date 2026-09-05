import { Printer, ShieldCheck, FileCheck, Building, Tag } from 'lucide-react';
import type { FiscalStatementData } from '../types';

interface FiscalValuationStatementProps {
  data?: FiscalStatementData;
  loading: boolean;
}

export function FiscalValuationStatement({ data, loading }: FiscalValuationStatementProps) {
  const formatCurrency = (val?: number) =>
    (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">
            Generating certified fiscal valuation statement...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Statement Print / Export Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Fiscal Inventory Valuation Statement
          </h3>
          <p className="text-xs text-gray-500">
            Statutory year-end inventory valuation and reconciliation trial balance (SRS Section 2.3
            & 4.4.8)
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF Statement
        </button>
      </div>

      {/* Printable Document Paper Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 print:border-none print:shadow-none">
        {/* Document Letterhead */}
        <div className="border-b-2 border-gray-900 pb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <FileCheck className="h-3.5 w-3.5" />
            Official Financial Statement
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 uppercase sm:text-3xl">
            Inventory Valuation & Asset Reconciliation Statement
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Methodology: First-In-First-Out (FIFO) Valuation Standard | Currency: Ethiopian Birr
            (ETB)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
            <span>
              <strong>Reporting Period:</strong>{' '}
              {data.period.from
                ? new Date(data.period.from).toLocaleDateString()
                : 'Fiscal Inception'}{' '}
              to {data.period.to ? new Date(data.period.to).toLocaleDateString() : 'Current Date'}
            </span>
            <span>•</span>
            <span>
              <strong>Certified Date:</strong>{' '}
              {new Date(data.certification.generatedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section 1: Balance Sheet Valuation Reconciliation Equation */}
        <div className="mt-8 space-y-4">
          <h4 className="text-sm font-bold tracking-wider text-gray-800 uppercase">
            1. Statutory Inventory Valuation Movement (Trial Balance)
          </h4>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-5 py-3">Financial Line Item</th>
                  <th className="px-5 py-3">Accounting Treatment</th>
                  <th className="px-5 py-3 text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-700">
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">
                    Beginning Inventory Valuation
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">Opening Asset Carry-Forward</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                    {formatCurrency(data.beginningInventoryValue)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-5 py-3.5 font-medium text-emerald-900">
                    (+) Inbound Material Purchases Capitalized (GRNs)
                  </td>
                  <td className="px-5 py-3.5 text-emerald-700">Asset Inbound Additions</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                    +{formatCurrency(data.inboundPurchasesValue)}
                  </td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="px-5 py-3.5 font-medium text-blue-900">
                    (-) Material Issues & Consumption (COGS)
                  </td>
                  <td className="px-5 py-3.5 text-blue-700">FIFO Cost Layer Depletion</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-700">
                    -{formatCurrency(data.materialConsumptionValue)}
                  </td>
                </tr>
                <tr className="bg-rose-50/40">
                  <td className="px-5 py-3.5 font-medium text-rose-900">
                    (-) Approved Damaged & Obsolete Write-Offs
                  </td>
                  <td className="px-5 py-3.5 text-rose-700">Impairment & Disposal Loss</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700">
                    -{formatCurrency(data.writeOffLossesValue)}
                  </td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="px-5 py-3.5 font-medium text-amber-900">
                    (±) Net Stock Take Reconciliation Adjustments
                  </td>
                  <td className="px-5 py-3.5 text-amber-700">Physical Count Variance Applied</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-700">
                    {data.stockTakeAdjustmentNetValue >= 0 ? '+' : ''}
                    {formatCurrency(data.stockTakeAdjustmentNetValue)}
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-900 bg-gray-50 text-base">
                  <td className="px-5 py-4 font-black text-gray-900 uppercase">
                    Ending Inventory Valuation (FIFO)
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-600">
                    Certified Closing Inventory Asset
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-black text-emerald-700">
                    ETB {formatCurrency(data.endingInventoryValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Breakdown by Category & Warehouse */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Category Breakdown */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold tracking-wider text-gray-800 uppercase">
                Valuation by Category
              </h4>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5 text-right">Items</th>
                    <th className="px-3 py-2.5 text-right">Units</th>
                    <th className="px-3 py-2.5 text-right">Valuation (ETB)</th>
                    <th className="px-3 py-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {data.categoryBreakdown.map((cat) => (
                    <tr key={cat.categoryId} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900">{cat.categoryName}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{cat.totalItems}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {cat.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                        {formatCurrency(cat.valuation)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-indigo-600">
                        {cat.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold tracking-wider text-gray-800 uppercase">
                Valuation by Warehouse
              </h4>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Warehouse</th>
                    <th className="px-3 py-2.5 text-right">Units</th>
                    <th className="px-3 py-2.5 text-right">Valuation (ETB)</th>
                    <th className="px-3 py-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {data.warehouseBreakdown.map((wh) => (
                    <tr key={wh.warehouseId} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900">{wh.warehouseName}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {wh.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                        {formatCurrency(wh.valuation)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-indigo-600">
                        {wh.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Official Sign-Off & Certification */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50/70 p-6 print:border-gray-300">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Statutory Accounting Compliance & Certification
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            {data.certification.certificationStatement}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="border-t border-gray-400 pt-3">
              <div className="text-xs font-bold text-gray-900">Prepared By: Bethlehem Fikru</div>
              <div className="text-[11px] text-gray-500">
                Accountant | Finance & Accounts Department
              </div>
              <div className="mt-2 font-mono text-[10px] text-gray-400">
                Signature: __________________________
              </div>
            </div>
            <div className="border-t border-gray-400 pt-3">
              <div className="text-xs font-bold text-gray-900">
                Certified By: Property Administration Officer (PAO)
              </div>
              <div className="text-[11px] text-gray-500">
                Property Administration & Inventory Oversight
              </div>
              <div className="mt-2 font-mono text-[10px] text-gray-400">
                Signature: __________________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
