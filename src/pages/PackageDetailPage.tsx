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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading package...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-300">Package not found.</p>
          {fetchError && (
            <p className="text-xs text-rose-400 max-w-sm mx-auto">{fetchError}</p>
          )}
          <p className="text-xs text-slate-500">The package may have been removed or is still syncing.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                setFetchError(null);
                setPkg(null);
                // Force re-mount by navigating to same URL
                navigate(0);
              }}
              className="px-4 py-2 text-xs font-medium text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
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

  const formattedExportDate = React.useMemo(() => {
    const d = pkg.exportedAt || pkg.postedAt;
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [pkg.exportedAt, pkg.postedAt]);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1424', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0a101d]/90 flex flex-col gap-3 shrink-0">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {pkg.courseCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 whitespace-nowrap">
                    <GraduationCap className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{pkg.courseCode}</span>
                  </span>
                )}
                {(() => {
                  const CatIcon = getCategoryIcon(pkg.category);
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                      <CatIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{pkg.category || 'General'}</span>
                    </span>
                  );
                })()}
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">
                {pkg.title}
              </h2>

              {pkg.institution && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{pkg.institution}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onReport(pkg)}
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/40 rounded-lg transition border border-slate-700/60 shrink-0"
            title="Report inappropriate content or broken links"
            aria-label="Report Package"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            {pkg.description}
          </p>
        )}

        {/* Author and Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <span className="flex items-center gap-1 text-slate-300 whitespace-nowrap">
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{pkg.author}</span>
              <span className="text-slate-500">({pkg.authorRole || 'Contributor'})</span>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Posted: {formattedExportDate}</span>
            </span>
            <span className="text-slate-400 whitespace-nowrap">
              Posted by: <span className="font-mono text-cyan-400">@{pkg.postedByUsername}</span>
            </span>
          </div>

          {pkg.tags && pkg.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {pkg.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 whitespace-nowrap"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-500 shrink-0" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-950/40 transition active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download JSON</span>
              <span className="ml-0.5 text-xs opacity-80 font-mono">({pkg.downloadCount ?? 0})</span>
            </button>

            <button
              onClick={(e) => onToggleLike(pkg, e)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                localIsLiked
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-400 border border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 shrink-0 ${localIsLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
              <span>{pkg.likeCount ?? 0}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition whitespace-nowrap"
              title="Copy clean package JSON to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition shrink-0"
              title="Copy package share link"
              aria-label="Share package"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleCollection}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
                isInCollection
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700'
              }`}
              title={isInCollection ? 'Remove from your collection' : 'Add to your collection'}
            >
              {isInCollection ? (
                <BookmarkCheck className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Bookmark className="w-4 h-4 shrink-0" />
              )}
              <span>{isInCollection ? 'In Collection' : 'Add to Collection'}</span>
            </button>

            <button
              onClick={() => onReport(pkg)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 rounded-lg transition whitespace-nowrap"
              title="Report inappropriate content or broken links"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>Report</span>
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={(e) => onDelete(pkg.id, pkg.title, e)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-lg transition ml-auto whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete</span>
            </button>
          )}
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-4 sm:px-6 bg-[#0a0f1d] border-b border-slate-800 text-xs font-medium overflow-x-auto scrollbar-thin">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Discussion ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 border-b-2 font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-[#0a0f1d]/50">

        {/* Discussion & Comments View */}
        {activeTab === 'comments' && (
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Add Comment Box */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Leave a Question or Feedback</span>
                </div>
                <span className="text-slate-400">
                  Posting as <strong className="text-cyan-400 font-mono">@{username || 'Anonymous'}</strong>
                </span>
              </div>

              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Ask questions about tricky options, share exam preparation strategies, or provide corrections..."
                  rows={3}
                  className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Tip: Be constructive and respect community guidelines.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentText.trim()}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-950/40 transition active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Community Discussion ({comments.length})</span>
                <span>Newest first</span>
              </div>

              {comments.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-[#0a0f1d]/60 border border-slate-800/80 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-300">No comments yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                      className="bg-[#0f172a]/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            @{cmt.username}
                          </span>
                          {cmt.username === pkg.author && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              Author
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedTime}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {cmt.content}
                      </p>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleToggleCommentLike(cmt.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition ${
                            isCommentLiked
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{cmt.likeCount ?? 0}</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(cmt.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
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
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                EXAMFORGE_PACKAGE (Schema v1 Compatible)
              </span>
              <button
                onClick={handleCopyJson}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy raw payload</span>
              </button>
            </div>

            <pre className="p-4 bg-[#070b14] border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-[450px]">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
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
                        className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/60">
                            Question {idx + 1}
                          </span>
                          {mcq.topic && (
                            <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                              Topic: {mcq.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                          {mcq.prompt}
                        </p>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {mcq.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === mcq.correctIndex;
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            let optionClass = "bg-slate-900/80 border-slate-800 text-slate-300";
                            if (isRevealed) {
                              if (isCorrect) {
                                optionClass = "bg-emerald-950/60 border-emerald-600/80 text-emerald-200 font-semibold";
                              } else {
                                optionClass = "bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60";
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
                                    : 'bg-slate-800 text-slate-300'
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

                        <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                          <button
                            onClick={() => toggleAnswerReveal(mcq.id)}
                            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium py-1"
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
                          <div className="mt-2 p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                            {mcq.explanation && (
                              <p className="text-slate-200 leading-relaxed">
                                <strong className="text-emerald-400">Explanation:</strong> {mcq.explanation}
                              </p>
                            )}
                            {mcq.reference && (
                              <p className="text-slate-400 text-[11px]">
                                <strong className="text-slate-300">Reference:</strong> {mcq.reference}
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
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
                        className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/60">
                            Essay Question {idx + 1}
                          </span>
                          {essay.topic && (
                            <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                              Topic: {essay.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                          {essay.prompt}
                        </p>

                        {(essay.explanation || essay.reference || essay.repeatNote) && (
                          <div className="pt-2 border-t border-slate-800/60 text-xs">
                            <button
                              onClick={() => toggleAnswerReveal(essay.id)}
                              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium py-1"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{isRevealed ? 'Hide Rubric & Notes' : 'View Scoring Rubric & Guide'}</span>
                            </button>

                            {isRevealed && (
                              <div className="mt-2 p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                                {essay.explanation && (
                                  <p className="text-slate-200 leading-relaxed">
                                    <strong className="text-indigo-400">Key Points / Rubric:</strong> {essay.explanation}
                                  </p>
                                )}
                                {essay.reference && (
                                  <p className="text-slate-400 text-[11px]">
                                    <strong className="text-slate-300">Reference:</strong> {essay.reference}
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
      <div className="p-3 sm:p-4 bg-[#0a101d] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Compatible with ExamForge Android v1.0+ import
        </span>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
        >
          Back
        </button>
      </div>

    </div>
  );
};
