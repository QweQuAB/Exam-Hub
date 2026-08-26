import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let borderClass = 'border-slate-700 bg-[#0d1424] text-slate-100';
        let Icon = Info;
        let iconColor = 'text-cyan-400';

        if (t.type === 'success') {
          borderClass = 'border-emerald-700/80 bg-[#081b17] text-emerald-100';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (t.type === 'error') {
          borderClass = 'border-rose-800/80 bg-[#1c0d12] text-rose-100';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl transition-all duration-300 animate-slideUp ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
