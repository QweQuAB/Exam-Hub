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
        let borderClass = 'border-line bg-surface text-fg';
        let Icon = Info;
        let iconColor = 'text-accent';

        if (t.type === 'success') {
          borderClass = 'border-accent-emerald/80 bg-accent-emerald/10 text-accent-emerald';
          Icon = CheckCircle2;
          iconColor = 'text-accent-emerald';
        } else if (t.type === 'error') {
          borderClass = 'border-accent-rose/80 bg-accent-rose/10 text-accent-rose';
          Icon = AlertCircle;
          iconColor = 'text-accent-rose';
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
              className="text-fg-muted hover:text-fg p-1 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
