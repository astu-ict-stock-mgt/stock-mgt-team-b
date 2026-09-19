import React from 'react';
import { Clock, LogIn, ShieldAlert } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLoginAgain: () => void;
  message?: string | null;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onLoginAgain,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 transition-all sm:p-8">
        {/* Visual Icon Badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/50">
          <Clock className="h-7 w-7 text-amber-600" aria-hidden="true" />
        </div>

        {/* Header and Title */}
        <div className="text-center">
          <h2
            id="session-expired-title"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Session Expired
          </h2>
          <p id="session-expired-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            {message ||
              'Your active session has timed out for security reasons. Please log in again to continue your work safely.'}
          </p>
        </div>

        {/* Non-Technical Explanatory Card */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-left">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <p className="text-xs leading-normal text-slate-500">
              For corporate security and inventory data protection, sessions expire after periods of
              inactivity. Please sign in to resume your tasks.
            </p>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onLoginAgain}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden active:bg-blue-800"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>Log In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
