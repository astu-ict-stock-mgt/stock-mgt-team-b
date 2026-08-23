import { useState } from 'react';
import type { ReportType } from '../types';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportType;
  onExportCsv: (reportType: string) => Promise<void>;
  onSaveReport: (name: string, type: string) => Promise<void>;
}

export function ReportExportModal({
  isOpen,
  onClose,
  activeTab,
  onExportCsv,
  onSaveReport,
}: ReportExportModalProps) {
  const [reportName, setReportName] = useState(
    `Executive ${activeTab.toUpperCase()} Report — ${new Date().toLocaleDateString()}`
  );
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'print'>('csv');
  const [saving, setSaving] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(true);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (saveToHistory) {
        await onSaveReport(reportName, activeTab);
      }

      if (selectedFormat === 'csv') {
        await onExportCsv(activeTab === 'overview' ? 'stock-movement' : activeTab);
      } else if (selectedFormat === 'print') {
        window.print();
      }

      onClose();
    } catch {
      // Handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Export & Archive Report</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleExport} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Report Title</label>
            <input
              type="text"
              required
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Export Format</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold">CSV / Excel</div>
                <div className="text-[10px] text-gray-400">Raw tabular data</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('print')}
                className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                  selectedFormat === 'print'
                    ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold">Print / PDF</div>
                <div className="text-[10px] text-gray-400">Formal document</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                  selectedFormat === 'json'
                    ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold">JSON API</div>
                <div className="text-[10px] text-gray-400">Structured data</div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="saveReportCheckbox"
              checked={saveToHistory}
              onChange={(e) => setSaveToHistory(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="saveReportCheckbox" className="text-xs font-medium text-gray-600">
              Save snapshot in system report history & audit log
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Exporting...' : 'Generate & Download'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
