import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, ArrowLeft, AlertTriangle, CheckCircle, Send, ShieldAlert, Link2Off, HelpCircle, FileWarning } from 'lucide-react';
import { ForumPackageDocument, ReportReason } from '../types';
import { submitPackageReport, getPackageById } from '../lib/firebase';

interface ReportPageProps {
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

export const ReportPage: React.FC<ReportPageProps> = ({
  username,
  onShowToast,
}) => {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();
  const [pkg, setPkg] = useState<ForumPackageDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!packageId) return;
    setLoading(true);
    getPackageById(packageId)
      .then((data) => {
        setPkg(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load package:', err);
        setLoading(false);
      });
  }, [packageId]);

  if (loading) {
    return (
      <div className="upload-page" style={{ minHeight: '100vh', background: '#0e1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading package...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="upload-page" style={{ minHeight: '100vh', background: '#0e1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Package not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
      navigate(-1);
    } catch (err: any) {
      console.error('Report submission error:', err);
      onShowToast(`Failed to submit report: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page" style={{ minHeight: '100vh', background: '#0e1628', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a101d] flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-700/60 text-rose-400 shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Report Package</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Flag issues to moderators</p>
          </div>
        </div>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">

        {/* Target Package Banner */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
            Reporting
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{pkg.title}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
            <span>{pkg.category || 'General'}</span>
            <span>•</span>
            <span>{pkg.author}</span>
          </div>
        </div>

        {/* Reason Selection Radio Group */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Reason <span className="text-rose-400">*</span>
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
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/70 text-slate-900 dark:text-slate-100 shadow-sm shadow-rose-950'
                      : 'bg-slate-100 dark:bg-[#070b14]/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={isChecked}
                    onChange={() => setSelectedReason(r.id)}
                    className="mt-0.5 text-rose-500 focus:ring-rose-500 h-4 w-4 bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-rose-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{r.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{r.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Details <span className="text-[11px] text-slate-500 font-normal">({details.length}/500)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            placeholder="Explain the issue..."
            rows={3}
            className="w-full bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-slate-700 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none"
          />
        </div>

        {/* Reporter Identification */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <span>As: <strong className="text-cyan-600 dark:text-cyan-400 font-mono">@{username || 'Anonymous'}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 transition active:scale-95 whitespace-nowrap disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Sending...' : 'Submit'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
