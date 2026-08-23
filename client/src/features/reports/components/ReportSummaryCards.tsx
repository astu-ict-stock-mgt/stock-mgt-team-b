import type { ReportsSummaryData } from '../types';

interface ReportSummaryCardsProps {
  summary: ReportsSummaryData | null;
  loading: boolean;
}

export function ReportSummaryCards({ summary, loading }: ReportSummaryCardsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      title: 'Total FIFO Valuation',
      value: summary ? formatCurrency(summary.totalFifoInventoryValue) : 'ETB 0',
      subtitle: `${summary?.totalItemsCount ?? 0} tracked stock items`,
      color: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-200/80',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      title: 'Total Receipts Value',
      value: summary ? formatCurrency(summary.totalReceivedValue) : 'ETB 0',
      subtitle: `From ${summary?.totalSuppliersCount ?? 0} verified suppliers`,
      color: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-200/80',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      ),
    },
    {
      title: 'Total Issues Value',
      value: summary ? formatCurrency(summary.totalIssuedValue) : 'ETB 0',
      subtitle: 'Issued to organizational departments',
      color: 'from-purple-500/10 to-indigo-500/5',
      borderColor: 'border-purple-200/80',
      textColor: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
    },
    {
      title: 'Stock Health & Alerts',
      value: `${summary?.lowStockCount ?? 0} Low Stock`,
      subtitle: summary?.lowStockCount ? 'Requires immediate replenishment' : 'All items optimal',
      color:
        summary && summary.lowStockCount > 0
          ? 'from-amber-500/10 to-orange-500/5'
          : 'from-gray-500/10 to-slate-500/5',
      borderColor:
        summary && summary.lowStockCount > 0 ? 'border-amber-200/80' : 'border-gray-200/80',
      textColor: summary && summary.lowStockCount > 0 ? 'text-amber-700' : 'text-gray-700',
      iconBg:
        summary && summary.lowStockCount > 0
          ? 'bg-amber-100 text-amber-600'
          : 'bg-gray-100 text-gray-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-xs transition-all hover:shadow-md ${card.color} ${card.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              {card.title}
            </p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                {card.icon}
              </svg>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200" />
            ) : (
              <p className={`text-xl font-extrabold sm:text-2xl ${card.textColor}`}>{card.value}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
