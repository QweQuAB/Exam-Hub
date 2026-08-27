import React from 'react';
import { Smartphone, X, Download, FileCheck, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface AndroidInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInfoModal: React.FC<AndroidInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">
      <div className="relative w-full sm:max-w-lg bg-[#0e1628] border border-cyan-500/40 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                Android Companion
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Package Compatibility Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs text-slate-300 overflow-y-auto max-h-[70vh]">
          
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              How to use packages
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Packages follow the <code className="text-cyan-400">EXAMFORGE_PACKAGE</code> schema.
            </p>
          </div>

          {/* 3 Step Guide */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <strong className="text-white block mb-0.5">Download JSON</strong>
                <span className="text-slate-400 text-[11px]">
                  Tap "Download" on any package card.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <strong className="text-white block mb-0.5">Open ExamForge Android</strong>
                <span className="text-slate-400 text-[11px]">
                  Launch the companion app on your phone.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <strong className="text-white block mb-0.5">Import & Practice</strong>
                <span className="text-slate-400 text-[11px]">
                  Tap "Import" → select the .json file. All questions load offline.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center gap-2 text-emerald-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Files are clean of forum-only metadata.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a101d] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
