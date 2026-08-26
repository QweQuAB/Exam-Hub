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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e1628] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                ExamForge Android Companion
              </h2>
              <p className="text-xs text-slate-400">
                100% Byte-for-Byte Package Compatibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              How to use these packages on Android
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Every package in this hub strictly adheres to the <code>EXAMFORGE_PACKAGE</code> schema version 1.
            </p>
          </div>

          {/* 3 Step Guide */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <strong className="text-white block mb-0.5">Download Package JSON</strong>
                <span className="text-slate-400">
                  Click the "Download .JSON" button on any exam package card or detail page.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <strong className="text-white block mb-0.5">Open ExamForge on Android</strong>
                <span className="text-slate-400">
                  Launch the ExamForge companion app on your phone or tablet.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <strong className="text-white block mb-0.5">Import and Practice Offline</strong>
                <span className="text-slate-400">
                  Tap "Import Package" → select the downloaded <code>.json</code> file. All MCQs, rubrics, and answer keys will load offline instantly.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Downloaded files are verified clean of forum-only metadata.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a101d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
