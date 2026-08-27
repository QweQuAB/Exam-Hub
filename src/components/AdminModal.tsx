import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  X, 
  Check, 
  AlertCircle, 
  Key, 
  Trash2, 
  AlertTriangle, 
  Flag, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Layers, 
  Link2Off, 
  ShieldAlert, 
  FileWarning, 
  HelpCircle,
  Inbox,
  Sparkles
} from 'lucide-react';
import { ADMIN_SECRET_KEY } from '../lib/constants';
import { PackageReport } from '../types';
import { 
  subscribeToPackageReports, 
  updateReportStatus, 
  deletePackageReport, 
  deletePackageFromFirestore 
} from '../lib/firebase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onPurgeCatalog?: () => Promise<void>;
  isAdmin?: boolean;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onInspectPackage?: (packageId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onPurgeCatalog,
  isAdmin = false,
  onShowToast,
  onInspectPackage,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  
  // Admin tabs
  const [activeTab, setActiveTab] = useState<'reports' | 'catalog'>('reports');
  const [reports, setReports] = useState<PackageReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Subscribe to reports
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToPackageReports(
      (data) => {
        setReports(data);
      },
      (err) => {
        console.error('Failed to load reports:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim() === ADMIN_SECRET_KEY) {
      setError(false);
      onSuccess();
      onShowToast('Moderator privileges enabled for this session.', 'success');
      setKeyInput('');
    } else {
      setError(true);
      onShowToast('Invalid moderator secret key.', 'error');
    }
  };

  const handlePurge = async () => {
    if (!onPurgeCatalog) return;
    setIsPurging(true);
    try {
      await onPurgeCatalog();
      setShowPurgeConfirm(false);
      onShowToast('Entire catalog purged successfully. Clean blank slate ready.', 'success');
    } catch (err: any) {
      onShowToast(`Failed to purge catalog: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleStatusChange = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setActionInProgressId(reportId);
    try {
      await updateReportStatus(reportId, status, 'Admin');
      onShowToast(`Report marked as ${status}.`, 'info');
    } catch (err: any) {
      onShowToast(`Failed to update report: ${err.message || 'Error'}`, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setActionInProgressId(reportId);
    try {
      await deletePackageReport(reportId);
      onShowToast('Report log removed.', 'info');
    } catch (err: any) {
      onShowToast(`Failed to delete report: ${err.message || 'Error'}`, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteReportedPackage = async (report: PackageReport) => {
    if (!window.confirm(`Delete package "${report.packageTitle}" and resolve this report?`)) {
      return;
    }
    setActionInProgressId(report.id);
    try {
      await deletePackageFromFirestore(report.packageId);
      await updateReportStatus(report.id, 'resolved', 'Admin');
      onShowToast(`Package "${report.packageTitle}" deleted and report resolved.`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to delete package: ${err.message || 'Error'}`, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    return true;
  });

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'broken_link':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <Link2Off className="w-3 h-3 text-amber-400" />
            <span>Broken Links / Corrupt</span>
          </span>
        );
      case 'inappropriate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/60">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Inappropriate Content</span>
          </span>
        );
      case 'incorrect_answers':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-950/80 text-orange-300 border border-orange-700/60">
            <FileWarning className="w-3 h-3 text-orange-400" />
            <span>Incorrect Answers</span>
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-700/60">
            <AlertTriangle className="w-3 h-3 text-purple-400" />
            <span>Spam / Duplicate</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Other Issue</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">
      <div className="relative w-full sm:max-w-2xl bg-[#0e1628] border border-amber-500/40 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-400 relative shrink-0">
              <Shield className="w-5 h-5" />
              {pendingReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-[#0a101d] animate-pulse"></span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                  Moderator Console
                </h2>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isAdmin
                  ? 'Review flags & manage safety'
                  : 'Authorized moderators only'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAdmin ? (
          <div className="p-4 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Moderator Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      if (error) setError(false);
                    }}
                    autoFocus
                    placeholder="••••••••••••••••"
                    className={`w-full bg-[#070b14] border ${
                      error ? 'border-rose-500' : 'border-slate-700 focus:border-amber-400'
                    } rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono tracking-widest focus:outline-none transition`}
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                {error && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Access key rejected. Try again.
                  </p>
                )}
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
                <p>
                  Unlocking allows inspection of flagged content and deletion permissions.
                </p>
                {pendingReportsCount > 0 && (
                  <p className="text-rose-400 font-semibold flex items-center gap-1 pt-1">
                    <Flag className="w-3.5 h-3.5 shrink-0" />
                    <span>{pendingReportsCount} pending report(s) awaiting moderation.</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-950/40 transition active:scale-95 whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Unlock Console</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex items-center justify-between px-3 sm:px-5 bg-[#0a0f1d] border-b border-slate-800 text-xs font-medium overflow-x-auto">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-3 px-2 sm:px-3 border-b-2 font-semibold transition inline-flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'reports'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 shrink-0" />
                  <span>Reports</span>
                  {pendingReportsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      {pendingReportsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`py-3 px-2 sm:px-3 border-b-2 font-semibold transition inline-flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'catalog'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Danger Zone</span>
                </button>
              </div>

              {activeTab === 'reports' && reports.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] shrink-0">
                  <button
                    onClick={() => setReportFilter('all')}
                    className={`px-2 py-0.5 rounded ${reportFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    All ({reports.length})
                  </button>
                  <button
                    onClick={() => setReportFilter('pending')}
                    className={`px-2 py-0.5 rounded ${reportFilter === 'pending' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400'}`}
                  >
                    Pending ({pendingReportsCount})
                  </button>
                  <button
                    onClick={() => setReportFilter('resolved')}
                    className={`px-2 py-0.5 rounded ${reportFilter === 'resolved' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-400'}`}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Tab Body */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
              
              {/* Reports Queue Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {filteredReports.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3 bg-[#0a0f1d]/60 border border-slate-800/80 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto text-emerald-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">No Flagged Reports in Queue</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          {reportFilter === 'pending'
                            ? 'All user reports have been reviewed and resolved. Great job!'
                            : 'No reports have been submitted yet. Community flags will appear here in real time.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredReports.map((rep) => {
                      const isPending = rep.status === 'pending';
                      const isWorking = actionInProgressId === rep.id;
                      const formattedTime = new Date(rep.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={rep.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isPending
                              ? 'bg-[#10192e] border-rose-900/60 shadow-md shadow-rose-950/20'
                              : 'bg-slate-900/40 border-slate-800 opacity-75'
                          }`}
                        >
                          {/* Report Header */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getReasonBadge(rep.reason)}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {rep.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white">
                                {rep.packageTitle}
                              </h4>
                            </div>

                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formattedTime}</span>
                            </span>
                          </div>

                          {/* Reported Details text */}
                          {rep.details ? (
                            <div className="p-2.5 my-2.5 bg-black/40 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                              <p className="text-[10px] font-mono uppercase text-slate-400 mb-0.5">Reporter Note:</p>
                              "{rep.details}"
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic my-2">No additional note provided by reporter.</p>
                          )}

                          {/* Footer & Actions */}
                          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <span>Reported by: <strong className="text-cyan-400 font-mono">@{rep.reportedBy}</strong></span>
                              <span>• Category: <span className="text-slate-300">{rep.category}</span></span>
                            </div>

                            {/* Moderator Controls */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              {/* Inspect Package Detail */}
                              {onInspectPackage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onInspectPackage(rep.packageId);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                                  title="Open package modal to view full questions"
                                >
                                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                                  <span>Inspect</span>
                                </button>
                              )}

                              {/* Delete Package Action */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReportedPackage(rep)}
                                disabled={isWorking}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                                title="Delete offending package and resolve report"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Delete Package</span>
                              </button>

                              {/* Dismiss or Resolve */}
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(rep.id, 'resolved')}
                                  disabled={isWorking}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
                                  title="Mark this report as resolved"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Resolve</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(rep.id)}
                                  disabled={isWorking}
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                                  title="Remove report log"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Catalog Danger Zone Tab */}
              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Moderator mode is enabled. You have full deletion controls across all published packages.</span>
                  </div>

                  {/* Danger Zone: Purge All Questions */}
                  {onPurgeCatalog && (
                    <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Danger Zone: Purge Entire Catalog</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Permanently delete all questions and packages currently stored in the forum database to start from a clean slate.
                      </p>

                      {!showPurgeConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Purge All Packages From Forum</span>
                        </button>
                      ) : (
                        <div className="space-y-2 p-3 bg-rose-950/80 border border-rose-700 rounded-lg">
                          <p className="text-xs text-rose-200 font-medium">
                            Are you completely sure? This will wipe every package in the database.
                          </p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowPurgeConfirm(false)}
                              className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handlePurge}
                              disabled={isPurging}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isPurging ? 'Purging...' : 'Confirm Purge All'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-[#0a101d] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">Esc</kbd> or click Done</span>
              <span className="sm:hidden text-[11px]">Tap Done to close</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Done
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
