import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Heart,
  Copy,
  Check,
  GraduationCap,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Info,
  Eye,
  EyeOff,
  Code2,
  Trash2,
  Share2,
  Tag,
  Building2,
  MessageSquare,
  Send,
  Flag,
  CornerDownRight,
  Clock,
  Bookmark,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';
import { ForumPackageDocument, PackageComment } from '../types';
import { cleanPackageForExport, downloadPackageAsJsonFile } from '../lib/validation';
import { getCategoryIcon } from '../lib/categoryIcons';
import {
  subscribeToPackageComments,
  addPackageComment,
  deletePackageComment,
  toggleCommentLike,
  subscribeToExamPackages
} from '../lib/firebase';

interface PackageDetailPageProps {
  onToggleLike: (pkg: ForumPackageDocument, e: React.MouseEvent) => void;
  onTrackDownload: (pkg: ForumPackageDocument, e: React.MouseEvent) => void;
  isLiked: boolean;
  isAdmin: boolean;
  username: string;
  onDelete: (packageId: string, title: string, e: React.MouseEvent) => void;
  onReport: (pkg: ForumPackageDocument) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PackageDetailPage: React.FC<PackageDetailPageProps> = ({
  onToggleLike,
  onTrackDownload,
  isLiked,
  isAdmin,
  username,
  onDelete,
  onReport,
  onShowToast,
}) => {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();

  // ALL useState hooks must be declared before any useEffect or conditional return
  const [pkg, setPkg] = useState<ForumPackageDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'essay' | 'comments' | 'json'>('all');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<PackageComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const COLLECTION_KEY = 'examforge_hub_collection';
  const [isInCollection, setIsInCollection] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(false);

  const targetIdRef = useRef(packageId);
  targetIdRef.current = packageId;

  // Subscribe to packages collection and find our package by ID
  useEffect(() => {
    if (!packageId) {
      setLoading(false);
      setFetchError('No package ID provided');
      return;
    }

    setLoading(true);
    setFetchError(null);
    setPkg(null);

    let foundOnce = false;

    const unsubscribe = subscribeToExamPackages(
      (packages) => {
        const id = targetIdRef.current;
        if (!id) return;

        const found = packages.find((p) => p.id === id || p.packageId === id);

        if (found) {
          foundOnce = true;
          setPkg(found);
          setLoading(false);
        } else if (foundOnce) {
          setPkg(null);
          setLoading(false);
          setFetchError('Package was removed');
        }
      },
      (err) => {
        console.error('Subscription error:', err);
        setFetchError(err.message || 'Failed to load package');
        setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      if (!foundOnce) {
        setFetchError('Package not found — it may still be syncing or does not exist');
        setLoading(false);
      }
    }, 8000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [packageId]);

  // Derive collection + liked state from localStorage
  useEffect(() => {
    if (!pkg) return;
    try {
      const collection: string[] = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
      setIsInCollection(collection.includes(pkg.id));
    } catch { setIsInCollection(false); }
    try {
      const savedLikes = JSON.parse(localStorage.getItem('examforge_hub_liked_ids') || '[]');
      setLocalIsLiked(savedLikes.includes(pkg.id));
    } catch { setLocalIsLiked(false); }
  }, [pkg?.id]);

  // Subscribe to comments
  useEffect(() => {
    if (!pkg) return;

    const pkgId = pkg.id || pkg.packageId;
    const unsubscribe = subscribeToPackageComments(
      pkgId,
      (data) => {
        setComments(data);
      },
      (err) => {
        console.error('Comments subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [pkg?.id, pkg?.packageId]);

  // ALL useMemo must be above early returns — React requires same hooks every render
  const formattedExportDate = React.useMemo(() => {
    if (!pkg) return '';
    const d = pkg.exportedAt || pkg.postedAt;
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [pkg?.exportedAt, pkg?.postedAt]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-fg-muted">Loading package...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <p className="text-sm text-fg-secondary">Package not found.</p>
          {fetchError && (
            <p className="text-xs text-rose-400 max-w-sm mx-auto">{fetchError}</p>
          )}
          <p className="text-xs text-fg-dim">The package may have been removed or is still syncing.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                setFetchError(null);
                setPkg(null);
                // Force re-mount by navigating to same URL
                navigate(0);
              }}
              className="px-4 py-2 text-xs font-medium text-accent hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-medium text-fg-secondary hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mcqs = pkg.mcqQuestions || [];
  const essays = pkg.essayQuestions || [];
  const totalQuestions = mcqs.length + essays.length;

  const toggleAnswerReveal = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownload = (e: React.MouseEvent) => {
    downloadPackageAsJsonFile(pkg);
    onTrackDownload(pkg, e);
    onShowToast(`Downloaded "${pkg.title}.json" for ExamForge Android`, 'success');
  };

  const handleCopyJson = () => {
    const cleanData = cleanPackageForExport(pkg);
    navigator.clipboard.writeText(JSON.stringify(cleanData, null, 2));
    setCopied(true);
    onShowToast('Package JSON copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('pkg', pkg.packageId);
    navigator.clipboard.writeText(url.toString());
    onShowToast('Direct package link copied to clipboard!', 'info');
  };

  const handleToggleCollection = () => {
    if (!pkg) return;
    try {
      const collection: string[] = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
      let updated: string[];
      if (collection.includes(pkg.id)) {
        updated = collection.filter((id) => id !== pkg.id);
        setIsInCollection(false);
        onShowToast('Removed from your collection', 'info');
      } else {
        updated = [...collection, pkg.id];
        setIsInCollection(true);
        onShowToast('Added to your collection!', 'success');
      }
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(updated));
    } catch {
      onShowToast('Failed to update collection', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const pkgId = pkg.id || pkg.packageId;
      await addPackageComment(pkgId, username || 'Anonymous', newCommentText.trim());
      setNewCommentText('');
      onShowToast('Comment posted successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      onShowToast(`Failed to post comment: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deletePackageComment(commentId);
      onShowToast('Comment deleted.', 'info');
    } catch (err: any) {
      onShowToast(`Failed to delete comment: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    const currentlyLiked = !!likedCommentIds[commentId];
    setLikedCommentIds((prev) => ({ ...prev, [commentId]: !currentlyLiked }));
    try {
      await toggleCommentLike(commentId, !currentlyLiked);
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    }
  };

  return (
    <div className="detail-page" style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="detail-header p-4 border-b border-line bg-surface-alt/90 flex flex-col gap-3 shrink-0">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-fg-muted hover:text-fg bg-muted hover:bg-line-strong rounded-lg transition shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {pkg.courseCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-accent/10 text-accent border border-accent/80 whitespace-nowrap">
                    <GraduationCap className="w-3 h-3 text-accent shrink-0" />
                    <span>{pkg.courseCode}</span>
                  </span>
                )}
                {(() => {
                  const CatIcon = getCategoryIcon(pkg.category);
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-fg-secondary border border-line-strong whitespace-nowrap">
                      <CatIcon className="w-3 h-3 text-fg-muted shrink-0" />
                      <span>{pkg.category || 'General'}</span>
                    </span>
                  );
                })()}
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold text-fg tracking-tight truncate">
                {pkg.title}
              </h2>

              {pkg.institution && (
                <p className="text-xs text-fg-muted flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{pkg.institution}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onReport(pkg)}
            className="p-2 text-fg-muted hover:text-accent-rose bg-surface-alt/80 hover:bg-accent-rose/20 rounded-lg transition border border-line-strong/60 shrink-0"
            title="Report inappropriate content or broken links"
            aria-label="Report Package"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-xs sm:text-sm text-fg-secondary/90 leading-relaxed bg-page/60 p-3.5 rounded-xl border border-line/80">
            {pkg.description}
          </p>
        )}

        {/* Author and Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted pt-2 border-t border-line/60">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <span className="flex items-center gap-1 text-fg-secondary whitespace-nowrap">
              <User className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>{pkg.author}</span>
              <span className="text-fg-dim">({pkg.authorRole || 'Contributor'})</span>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-fg-dim shrink-0" />
              <span>Posted: {formattedExportDate}</span>
            </span>
            <span className="text-fg-muted whitespace-nowrap">
              Posted by: <span className="font-mono text-accent">@{pkg.postedByUsername}</span>
            </span>
          </div>

          {pkg.tags && pkg.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {pkg.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-secondary bg-surface-alt/80 px-2 py-0.5 rounded border border-line-strong/60 whitespace-nowrap"
                >
                  <Tag className="w-2.5 h-2.5 text-fg-dim shrink-0" />
                  <span>#{t}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-fg bg-gradient-to-r from-accent to-accent-blue hover:from-accent hover:to-accent-blue rounded-lg shadow-md shadow-accent/40 transition active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download JSON</span>
              <span className="ml-0.5 text-xs opacity-80 font-mono">({pkg.downloadCount ?? 0})</span>
            </button>

            <button
              onClick={(e) => onToggleLike(pkg, e)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                localIsLiked
                  ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose'
                  : 'bg-muted hover:bg-line-strong text-fg-secondary hover:text-accent-rose border border-line-strong'
              }`}
            >
              <Heart className={`w-4 h-4 shrink-0 ${localIsLiked ? 'fill-accent-rose text-accent-rose' : 'text-fg-muted'}`} />
              <span>{pkg.likeCount ?? 0}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-fg-secondary hover:text-fg bg-muted hover:bg-line-strong border border-line-strong rounded-lg transition whitespace-nowrap"
              title="Copy clean package JSON to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              className="p-2 text-fg-muted hover:text-accent bg-muted hover:bg-line-strong border border-line-strong rounded-lg transition shrink-0"
              title="Copy package share link"
              aria-label="Share package"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleCollection}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
                isInCollection
                  ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber'
                  : 'bg-muted hover:bg-line-strong text-fg-secondary hover:text-accent-amber border border-line-strong'
              }`}
              title={isInCollection ? 'Remove from your collection' : 'Add to your collection'}
            >
              {isInCollection ? (
                <BookmarkCheck className="w-4 h-4 text-accent-amber shrink-0" />
              ) : (
                <Bookmark className="w-4 h-4 shrink-0" />
              )}
              <span>{isInCollection ? 'In Collection' : 'Add to Collection'}</span>
            </button>

            <button
              onClick={() => onReport(pkg)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-fg-muted hover:text-accent-rose bg-surface-alt/80 hover:bg-accent-rose/20 border border-line-strong rounded-lg transition whitespace-nowrap"
              title="Report inappropriate content or broken links"
            >
              <Flag className="w-3.5 h-3.5 text-accent-rose" />
              <span>Report</span>
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={(e) => onDelete(pkg.id, pkg.title, e)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent-rose bg-accent-rose/40 hover:bg-accent-rose border border-accent-rose rounded-lg transition ml-auto whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete</span>
            </button>
          )}
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-4 sm:px-6 bg-page border-b border-line text-xs font-medium overflow-x-auto scrollbar-thin">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Questions ({totalQuestions})</span>
          </button>

          {mcqs.length > 0 && (
            <button
              onClick={() => setActiveTab('mcq')}
              className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'mcq'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>MCQs ({mcqs.length})</span>
            </button>
          )}

          {essays.length > 0 && (
            <button
              onClick={() => setActiveTab('essay')}
              className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'essay'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Essays ({essays.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Discussion ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="detail-body p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-page/50">

        {/* Discussion & Comments View */}
        {activeTab === 'comments' && (
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Add Comment Box */}
            <div className="bg-surface-alt border border-line rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between text-xs text-fg-secondary">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span className="font-bold">Leave a Question or Feedback</span>
                </div>
                <span className="text-fg-muted">
                  Posting as <strong className="text-accent font-mono">@{username || 'Anonymous'}</strong>
                </span>
              </div>

              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Ask questions about tricky options, share exam preparation strategies, or provide corrections..."
                  rows={3}
                  className="w-full bg-muted border border-line-strong focus:border-accent rounded-xl p-3 text-xs sm:text-sm text-fg placeholder-slate-500 focus:outline-none transition resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-fg-dim hidden sm:inline">
                    Tip: Be constructive and respect community guidelines.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentText.trim()}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-fg bg-accent hover:bg-accent rounded-lg shadow-md shadow-accent/40 transition active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-fg-muted px-1">
                <span>Community Discussion ({comments.length})</span>
                <span>Newest first</span>
              </div>

              {comments.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-page/60 border border-line/80 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-fg-muted mx-auto" />
                  <h4 className="text-sm font-semibold text-fg-secondary">No comments yet</h4>
                  <p className="text-xs text-fg-dim max-w-sm mx-auto">
                    Be the first to ask a question, give feedback on the answer keys, or thank the author!
                  </p>
                </div>
              ) : (
                comments.map((cmt) => {
                  const isAuthor = cmt.username === username;
                  const canDelete = isAuthor || isAdmin;
                  const isCommentLiked = !!likedCommentIds[cmt.id];
                  const formattedTime = new Date(cmt.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={cmt.id}
                      className="bg-surface-alt/90 border border-line hover:border-line-strong/80 rounded-xl p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent flex items-center gap-1">
                            <User className="w-3 h-3 text-fg-muted" />
                            @{cmt.username}
                          </span>
                          {cmt.username === pkg.author && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent-amber/10 text-accent-amber border border-accent-amber">
                              Author
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-fg-dim flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedTime}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-fg leading-relaxed whitespace-pre-wrap">
                        {cmt.content}
                      </p>

                      <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-fg-muted">
                        <button
                          type="button"
                          onClick={() => handleToggleCommentLike(cmt.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition ${
                            isCommentLiked
                              ? 'text-accent-rose font-semibold'
                              : 'text-fg-muted hover:text-accent-rose'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-accent-rose text-accent-rose' : ''}`} />
                          <span>{cmt.likeCount ?? 0}</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(cmt.id)}
                            className="text-fg-dim hover:text-accent-rose p-1 rounded transition"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* JSON Inspector View */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                EXAMFORGE_PACKAGE (Schema v1 Compatible)
              </span>
              <button
                onClick={handleCopyJson}
                className="text-accent hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy raw payload</span>
              </button>
            </div>

            <pre className="p-4 bg-muted border border-line rounded-xl text-xs font-mono text-fg-secondary overflow-x-auto max-h-[450px]">
              {JSON.stringify(cleanPackageForExport(pkg), null, 2)}
            </pre>
          </div>
        )}

        {/* Questions Render List */}
        {activeTab !== 'json' && activeTab !== 'comments' && (
          <div className="space-y-6">

            {/* MCQs Section */}
            {(activeTab === 'all' || activeTab === 'mcq') && mcqs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Multiple-Choice Questions ({mcqs.length})</span>
                  </h3>
                </div>

                <div className="space-y-4">
                  {mcqs.map((mcq, idx) => {
                    const isRevealed = !!revealedAnswers[mcq.id];
                    return (
                      <div
                        key={mcq.id || idx}
                        className="bg-surface-alt/90 border border-line rounded-xl p-4 sm:p-5 space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/60">
                            Question {idx + 1}
                          </span>
                          {mcq.topic && (
                            <span className="text-xs text-fg-muted bg-muted/60 px-2 py-0.5 rounded">
                              Topic: {mcq.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-fg leading-snug">
                          {mcq.prompt}
                        </p>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {mcq.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === mcq.correctIndex;
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            let optionClass = "bg-page/80 border-line text-fg-secondary";
                            if (isRevealed) {
                              if (isCorrect) {
                                optionClass = "bg-emerald-950/60 border-emerald-600/80 text-emerald-200 font-semibold";
                              } else {
                                optionClass = "bg-page/40 border-line/40 text-fg-muted opacity-60";
                              }
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`flex items-start gap-3 p-3 rounded-lg border text-xs sm:text-sm transition ${optionClass}`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                                  isRevealed && isCorrect
                                    ? 'bg-emerald-500 text-black font-bold'
                                    : 'bg-muted text-fg-secondary'
                                }`}>
                                  {optionLetter}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                                {isRevealed && isCorrect && (
                                  <span className="text-xs font-bold text-emerald-400 ml-auto shrink-0 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-line/60 text-xs">
                          <button
                            onClick={() => toggleAnswerReveal(mcq.id)}
                            className="inline-flex items-center gap-1.5 text-accent hover:text-accent font-medium py-1"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isRevealed ? 'Hide Answer & Explanation' : 'Reveal Answer Key'}</span>
                          </button>

                          {mcq.repeatNote && (
                            <span className="text-amber-400/90 text-[11px] italic">
                              Note: {mcq.repeatNote}
                            </span>
                          )}
                        </div>

                        {isRevealed && (
                          <div className="mt-2 p-3 bg-accent-emerald/10 border border-accent-emerald/40 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                            {mcq.explanation && (
                              <p className="text-fg leading-relaxed">
                                <strong className="text-emerald-400">Explanation:</strong> {mcq.explanation}
                              </p>
                            )}
                            {mcq.reference && (
                              <p className="text-fg-muted text-[11px]">
                                <strong className="text-fg-secondary">Reference:</strong> {mcq.reference}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Essay Questions Section */}
            {(activeTab === 'all' || activeTab === 'essay') && essays.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-indigo-400" />
                    <span>Essay Questions ({essays.length})</span>
                  </h3>
                </div>

                <div className="space-y-4">
                  {essays.map((essay, idx) => {
                    const isRevealed = !!revealedAnswers[essay.id];
                    return (
                      <div
                        key={essay.id || idx}
                        className="bg-surface-alt/90 border border-line rounded-xl p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-accent-indigo bg-accent-indigo/10 px-2 py-0.5 rounded border border-accent-indigo/40">
                            Essay Question {idx + 1}
                          </span>
                          {essay.topic && (
                            <span className="text-xs text-fg-muted bg-muted/60 px-2 py-0.5 rounded">
                              Topic: {essay.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-fg leading-snug">
                          {essay.prompt}
                        </p>

                        {(essay.explanation || essay.reference || essay.repeatNote) && (
                          <div className="pt-2 border-t border-line/60 text-xs">
                            <button
                              onClick={() => toggleAnswerReveal(essay.id)}
                              className="inline-flex items-center gap-1.5 text-accent-indigo hover:text-accent-indigo font-medium py-1"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{isRevealed ? 'Hide Rubric & Notes' : 'View Scoring Rubric & Guide'}</span>
                            </button>

                            {isRevealed && (
                              <div className="mt-2 p-3 bg-accent-indigo/10 border border-accent-indigo/40 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                                {essay.explanation && (
                                  <p className="text-fg leading-relaxed">
                                    <strong className="text-accent-indigo">Key Points / Rubric:</strong> {essay.explanation}
                                  </p>
                                )}
                                {essay.reference && (
                                  <p className="text-fg-muted text-[11px]">
                                    <strong className="text-fg-secondary">Reference:</strong> {essay.reference}
                                  </p>
                                )}
                                {essay.repeatNote && (
                                  <p className="text-amber-400/90 text-[11px] italic">
                                    <strong>Note:</strong> {essay.repeatNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer info bar */}
      <div className="detail-footer p-3 sm:p-4 bg-surface-alt border-t border-line/80 flex items-center justify-between text-xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-accent" />
          Compatible with ExamForge Android v1.0+ import
        </span>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 bg-muted hover:bg-line-strong text-fg rounded-lg text-xs font-medium transition"
        >
          Back
        </button>
      </div>

    </div>
  );
};
