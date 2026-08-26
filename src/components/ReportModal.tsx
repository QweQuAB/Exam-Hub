import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle, Send, ShieldAlert, Link2Off, HelpCircle, FileWarning } from 'lucide-react';
import { ForumPackageDocument, ReportReason } from '../types';
import { submitPackageReport } from '../lib/firebase';

interface ReportModalProps {
  pkg: ForumPackageDocument | null;
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const REPORT_REASONS: {
  id: ReportReason;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'broken_link',
    label: 'Broken Links / Parsing Errors',
    desc: 'Package fails to import, questions corrupted, or reference URLs broken.',
    icon: Link2Off,
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate or Harmful Content',
    desc: 'Contains abusive, offensive, defamatory, or non-academic material.',
    icon: ShieldAlert,
  },
  {
    id: 'incorrect_answers',
    label: 'Incorrect Answers or Explanations',
    desc: 'Severe factual errors in answer keys, rubrics, or misleading prompts.',
    icon: FileWarning,
  },
  {
    id: 'spam',
    label: 'Spam / Duplicate Submission',
    desc: 'Redundant duplicates, promotional ads, or junk text.',
    icon: AlertTriangle,
  },
  {
    id: 'other',
    label: 'Other Issue',
    desc: 'Any other violation or quality concern not listed above.',
    icon: HelpCircle,
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  pkg,
  isOpen,
  onClose,
  username,
  onShowToast,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pkg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      await submitPackageReport({
        packageId: pkg.id || pkg.packageId,
        packageTitle: pkg.title,
        author: pkg.author || 'Unknown',
        category: pkg.category || 'General',
        reason: selectedReason,
        reasonLabel: selectedObj?.label || 'Flagged',
        details: details.trim(),
        reportedBy: username || 'Anonymous',
      });

      onShowToast('Report submitted. Our moderation team has been notified.', 'success');
      setDetails('');
      setSelectedReason('broken_link');
      onClose();
    } catch (err: any) {
      console.error('Report submission error:', err);
      onShowToast(`Failed to submit report: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e1628] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Report Exam Package</h2>
              <p className="text-xs text-slate-400">Flag issues directly to community moderators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Target Package Banner */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Target Package
            </p>
            <p className="text-sm font-bold text-slate-100 line-clamp-1">{pkg.title}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Category: <strong className="text-slate-300">{pkg.category || 'General'}</strong></span>
              <span>Author: <strong className="text-slate-300">{pkg.author}</strong></span>
            </div>
          </div>

          {/* Reason Selection Radio Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Reason for Flagging <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => {
                const isChecked = selectedReason === r.id;
                const IconComponent = r.icon;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? 'bg-rose-950/30 border-rose-500/70 text-slate-100 shadow-sm shadow-rose-950'
                        : 'bg-[#070b14]/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={isChecked}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 text-rose-500 focus:ring-rose-500 h-4 w-4 bg-slate-900 border-slate-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-3.5 h-3.5 ${isChecked ? 'text-rose-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-200">{r.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Additional Context / Problem Details</span>
              <span className="text-[11px] text-slate-500 font-normal">{details.length}/500</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Please explain the specific issue (e.g., 'Question 4 is missing options', 'Contains offensive language in explanation', 'Link in reference is broken')..."
              rows={3}
              className="w-full bg-[#070b14] border border-slate-700 focus:border-rose-500 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Reporter Identification */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span>Submitting as: <strong className="text-cyan-400 font-mono">@{username || 'Anonymous'}</strong></span>
            <span className="text-[11px] text-slate-500">Sent to Moderator Console</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 transition active:scale-95 whitespace-nowrap disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Report...' : 'Submit Report'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
