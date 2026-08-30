import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  ArrowLeft,
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
  Sparkles,
  X
} from 'lucide-react';
import { ADMIN_SECRET_KEY } from '../lib/constants';
import { PackageReport } from '../types';
import {
  subscribeToPackageReports,
  updateReportStatus,
  deletePackageReport,
  deletePackageFromFirestore,
  purgeAllPackagesFromFirestore
} from '../lib/firebase';

interface AdminPageProps {
  currentUserUsername: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUserUsername,
}) => {
  const navigate = useNavigate();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<'reports' | 'catalog'>('reports');
  const [reports, setReports] = useState<PackageReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const addToast = (msg: string, type?: 'success' | 'info' | 'error') => {
    alert(msg);
  };

  useEffect(() => {
    const unsubscribe = subscribeToPackageReports(
      (data) => {
        setReports(data);
      },
      (err) => {
        console.error('Failed to load reports:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim() === ADMIN_SECRET_KEY) {
      setError(false);
      setIsAdmin(true);
      addToast('Moderator privileges enabled for this session.', 'success');
      setKeyInput('');
    } else {
      setError(true);
      addToast('Invalid moderator secret key.', 'error');
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      await purgeAllPackagesFromFirestore();
      setShowPurgeConfirm(false);
      addToast('Entire catalog purged successfully. Clean blank slate ready.', 'success');
    } catch (err: any) {
      addToast(`Failed to purge catalog: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleStatusChange = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setActionInProgressId(reportId);
    try {
      await updateReportStatus(reportId, status, currentUserUsername);
      addToast(`Report marked as ${status}.`, 'info');
    } catch (err: any) {
      addToast(`Failed to update report: ${err.message || 'Error'}`, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setActionInProgressId(reportId);
    try {
      await deletePackageReport(reportId);
      addToast('Report log removed.', 'info');
    } catch (err: any) {
      addToast(`Failed to delete report: ${err.message || 'Error'}`, 'error');
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
      await updateReportStatus(report.id, 'resolved', currentUserUsername);
      addToast(`Package "${report.packageTitle}" deleted and report resolved.`, 'success');
    } catch (err: any) {
      addToast(`Failed to delete package: ${err.message || 'Error'}`, 'error');
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-amber/40 text-accent-amber border border-accent-amber/60">
            <Link2Off className="w-3 h-3 text-accent-amber" />
            <span>Broken Links / Corrupt</span>
          </span>
        );
      case 'inappropriate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-rose/30 text-accent-rose border border-accent-rose/60">
            <ShieldAlert className="w-3 h-3 text-accent-rose" />
            <span>Inappropriate Content</span>
          </span>
        );
      case 'incorrect_answers':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-amber/40 text-accent-amber border border-accent-amber/60">
            <FileWarning className="w-3 h-3 text-accent-amber" />
            <span>Incorrect Answers</span>
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/40">
            <AlertTriangle className="w-3 h-3 text-accent-indigo" />
            <span>Spam / Duplicate</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-fg-secondary border border-line-strong">
            <HelpCircle className="w-3 h-3 text-fg-muted" />
            <span>Other Issue</span>
          </span>
        );
    }
  };

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
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-accent-amber/40 border border-accent-amber/60 text-accent-amber relative shrink-0">
            <Shield className="w-5 h-5" />
            {pendingReportsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-rose ring-2 ring-surface-alt animate-pulse"></span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-fg truncate">
                Moderator Console
              </h2>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-emerald/30 text-accent-emerald border border-accent-emerald/40 shrink-0">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-fg-muted truncate">
              {isAdmin
                ? 'Review flags & manage safety'
                : 'Authorized moderators only'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isAdmin ? (
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1.5">
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
                  className={`w-full bg-muted border ${
                    error ? 'border-rose-500' : 'border-line-strong focus:border-accent-amber'
                  } rounded-xl px-3.5 py-2.5 text-sm text-fg font-mono tracking-widest focus:outline-none transition`}
                />
                <Key className="w-4 h-4 text-fg-muted absolute right-3 top-3.5 pointer-events-none" />
              </div>
              {error && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Access key rejected. Try again.
                </p>
              )}
            </div>

            <div className="text-[11px] text-fg-muted leading-relaxed bg-page/60 p-3 rounded-lg border border-line space-y-1">
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
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 text-xs font-medium text-fg-secondary hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-black bg-accent-amber hover:bg-accent-amber/80 rounded-lg shadow-md shadow-accent-amber/20 transition active:scale-95 whitespace-nowrap"
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
          <div className="flex items-center justify-between px-3 sm:px-5 bg-page border-b border-line text-xs font-medium overflow-x-auto">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 px-2 sm:px-3 border-b-2 font-semibold transition inline-flex items-center gap-1 whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-accent-amber text-accent-amber'
                    : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                <Flag className="w-3.5 h-3.5 shrink-0" />
                <span>Reports</span>
                {pendingReportsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-accent-rose text-fg text-[10px] font-bold">
                    {pendingReportsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className={`py-3 px-2 sm:px-3 border-b-2 font-semibold transition inline-flex items-center gap-1 whitespace-nowrap ${
                  activeTab === 'catalog'
                    ? 'border-accent-amber text-accent-amber'
                    : 'border-transparent text-fg-muted hover:text-fg'
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
                  className={`px-2 py-0.5 rounded ${reportFilter === 'all' ? 'bg-line-strong text-fg' : 'text-fg-muted'}`}
                >
                  All ({reports.length})
                </button>
                <button
                  onClick={() => setReportFilter('pending')}
                  className={`px-2 py-0.5 rounded ${reportFilter === 'pending' ? 'bg-accent-rose/30 text-accent-rose font-bold border border-accent-rose/80' : 'text-fg-muted'}`}
                >
                  Pending ({pendingReportsCount})
                </button>
                <button
                  onClick={() => setReportFilter('resolved')}
                  className={`px-2 py-0.5 rounded ${reportFilter === 'resolved' ? 'bg-accent-emerald/30 text-accent-emerald font-bold border border-accent-emerald/40' : 'text-fg-muted'}`}
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
                  <div className="py-12 px-4 text-center space-y-3 bg-page/60 border border-line/80 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-accent-emerald/30 border border-accent-emerald/40 flex items-center justify-center mx-auto text-accent-emerald">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-fg">No Flagged Reports in Queue</h4>
                      <p className="text-xs text-fg-muted max-w-sm mx-auto mt-1">
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
                            ? 'bg-surface border-accent-rose/60 shadow-md shadow-accent-rose/20'
                            : 'bg-page/60 border-line opacity-75'
                        }`}
                      >
                        {/* Report Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getReasonBadge(rep.reason)}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isPending
                                  ? 'bg-accent-rose/30 text-accent-rose border border-accent-rose/80'
                                  : 'bg-accent-emerald/30 text-accent-emerald border border-accent-emerald/40'
                              }`}>
                                {rep.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-fg">
                              {rep.packageTitle}
                            </h4>
                          </div>

                          <span className="text-[11px] text-fg-muted font-mono flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-fg-muted" />
                            <span>{formattedTime}</span>
                          </span>
                        </div>

                        {/* Reported Details text */}
                        {rep.details ? (
                          <div className="p-2.5 my-2.5 bg-black/40 rounded-lg border border-line/80 text-xs text-fg-secondary leading-relaxed">
                            <p className="text-[10px] font-mono uppercase text-fg-muted mb-0.5">Reporter Note:</p>
                            "{rep.details}"
                          </div>
                        ) : (
                          <p className="text-xs text-fg-muted italic my-2">No additional note provided by reporter.</p>
                        )}

                        {/* Footer & Actions */}
                        <div className="pt-2 mt-2 border-t border-line/80 flex items-center justify-between gap-2 flex-wrap text-xs text-fg-muted">
                          <div className="flex items-center gap-2">
                            <span>Reported by: <strong className="text-accent font-mono">@{rep.reportedBy}</strong></span>
                            <span>• Category: <span className="text-fg-secondary">{rep.category}</span></span>
                          </div>

                          {/* Moderator Controls */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {/* Inspect Package Detail */}
                            <button
                              type="button"
                              onClick={() => navigate(`/package/${rep.packageId}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted hover:bg-line-strong text-fg-secondary border border-line-strong transition"
                              title="Open package detail page to view full questions"
                            >
                              <ExternalLink className="w-3 h-3 text-accent" />
                              <span>Inspect</span>
                            </button>

                            {/* Delete Package Action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteReportedPackage(rep)}
                              disabled={isWorking}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-rose/30 hover:bg-accent-rose text-accent-rose border border-accent-rose/80 transition"
                              title="Delete offending package and resolve report"
                            >
                              <Trash2 className="w-3 h-3 text-accent-rose" />
                              <span>Delete Package</span>
                            </button>

                            {/* Dismiss or Resolve */}
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(rep.id, 'resolved')}
                                disabled={isWorking}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-emerald/30 hover:bg-accent-emerald text-accent-emerald border border-accent-emerald/40 transition"
                                title="Mark this report as resolved"
                              >
                                <CheckCircle2 className="w-3 h-3 text-accent-emerald" />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(rep.id)}
                                disabled={isWorking}
                                className="p-1 text-fg-muted hover:text-accent-rose rounded transition"
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
                <div className="flex items-center gap-2 p-3 bg-accent-emerald/30 border border-accent-emerald/40 rounded-xl text-accent-emerald text-xs">
                  <Check className="w-4 h-4 text-accent-emerald shrink-0" />
                  <span>Moderator mode is enabled. You have full deletion controls across all published packages.</span>
                </div>

                {/* Danger Zone: Purge All Questions */}
                <div className="p-4 bg-accent-rose/20 border border-accent-rose/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-accent-rose font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-accent-rose shrink-0" />
                    <span>Danger Zone: Purge Entire Catalog</span>
                  </div>
                  <p className="text-[11px] text-fg-muted leading-relaxed">
                    Permanently delete all questions and packages currently stored in the forum database to start from a clean slate.
                  </p>

                  {!showPurgeConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowPurgeConfirm(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-rose/30 hover:bg-accent-rose text-accent-rose border border-accent-rose/80 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Purge All Packages From Forum</span>
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-accent-rose/30 border border-accent-rose rounded-lg">
                      <p className="text-xs text-accent-rose font-medium">
                        Are you completely sure? This will wipe every package in the database.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(false)}
                          className="px-3 py-1.5 text-xs text-fg-secondary bg-muted hover:bg-line-strong rounded-md transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePurge}
                          disabled={isPurging}
                          className="px-3 py-1.5 text-xs font-semibold text-fg bg-accent-rose hover:bg-accent-rose/80 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isPurging ? 'Purging...' : 'Confirm Purge All'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-surface-alt border-t border-line/80 flex items-center justify-end text-xs text-fg-muted shrink-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-xs font-medium text-fg-secondary hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition"
            >
              Done
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
