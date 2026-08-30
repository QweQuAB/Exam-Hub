import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft, Download, FileCheck, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const AndroidPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="upload-page" style={{ minHeight: '100vh', background: 'var(--c-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="p-4 border-b border-line bg-surface-alt flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-fg-muted hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-accent-emerald/40 border border-accent-emerald/60 text-accent-emerald shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-fg truncate">
              Android Companion
            </h2>
            <p className="text-[11px] text-fg-muted truncate">
              Package Compatibility Guide
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-xs text-fg-secondary overflow-y-auto flex-1">

        <div className="bg-page/80 border border-line p-3 rounded-xl space-y-1">
          <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-accent shrink-0" />
            How to use packages
          </h3>
          <p className="text-fg-muted leading-relaxed text-[11px]">
            Packages follow the <code className="text-accent">EXAMFORGE_PACKAGE</code> schema.
          </p>
        </div>

        {/* 3 Step Guide */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-page/40 border border-line/60">
            <span className="w-6 h-6 rounded-full bg-accent/10 text-accent border border-accent/60 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <div>
              <strong className="text-fg block mb-0.5">Download JSON</strong>
              <span className="text-fg-muted text-[11px]">
                Tap "Download" on any package card.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-page/40 border border-line/60">
            <span className="w-6 h-6 rounded-full bg-accent/10 text-accent border border-accent/60 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <div>
              <strong className="text-fg block mb-0.5">Open ExamForge Android</strong>
              <span className="text-fg-muted text-[11px]">
                Launch the companion app on your phone.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-page/40 border border-line/60">
            <span className="w-6 h-6 rounded-full bg-accent/10 text-accent border border-accent/60 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <div>
              <strong className="text-fg block mb-0.5">Import & Practice</strong>
              <span className="text-fg-muted text-[11px]">
                Tap "Import" → select the .json file. All questions load offline.
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/40 rounded-xl flex items-center gap-2 text-accent-emerald text-[11px]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Files are clean of forum-only metadata.</span>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-line bg-surface-alt flex justify-end shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 text-xs font-semibold text-fg bg-muted hover:bg-line-strong rounded-lg transition"
        >
          Got it
        </button>
      </div>

    </div>
  );
};
