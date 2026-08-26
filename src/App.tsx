import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Filter,
  ArrowUpDown,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  FileQuestion,
  X,
  Smartphone,
  Flame,
  Clock,
  Download,
  AlertCircle,
  Plus,
  RefreshCw,
  LayoutGrid,
  Tag,
  BookOpen,
  UploadCloud
} from 'lucide-react';
import { ForumPackageDocument, ExamForgePackage, SortOption, FilterState } from './types';
import {
  subscribeToExamPackages,
  uploadPackageToFirestore,
  toggleLikeInFirestore,
  trackDownloadInFirestore,
  deletePackageFromFirestore,
  purgeAllPackagesFromFirestore,
} from './lib/firebase';
import { POPULAR_CATEGORIES, DEFAULT_USERNAMES } from './lib/constants';
import { getCategoryIcon } from './lib/categoryIcons';
import { Header } from './components/Header';
import { PackageCard } from './components/PackageCard';
import { PackageDetailModal } from './components/PackageDetailModal';
import { UploadModal } from './components/UploadModal';
import { AdminModal } from './components/AdminModal';
import { UsernameModal } from './components/UsernameModal';
import { AndroidInfoModal } from './components/AndroidInfoModal';
import { ReportModal } from './components/ReportModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const USERNAME_STORAGE_KEY = 'examforge_hub_username';
const LIKES_STORAGE_KEY = 'examforge_hub_liked_ids';

export default function App() {
  // State
  const [packages, setPackages] = useState<ForumPackageDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // User state
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Likes tracking
  const [likedPackageIds, setLikedPackageIds] = useState<string[]>([]);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ForumPackageDocument | null>(null);
  const [packageToReport, setPackageToReport] = useState<ForumPackageDocument | null>(null);

  // Delete confirmation modal state
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; title: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [typeFilter, setTypeFilter] = useState<'all' | 'has_mcq' | 'has_essay'>('all');

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize username and liked IDs from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUser && savedUser.trim()) {
      setUsername(savedUser);
    } else {
      const defaultName = `${DEFAULT_USERNAMES[Math.floor(Math.random() * DEFAULT_USERNAMES.length)]}${Math.floor(Math.random() * 899 + 100)}`;
      setUsername(defaultName);
      localStorage.setItem(USERNAME_STORAGE_KEY, defaultName);
      setIsFirstVisit(true);
      setShowUsernameModal(true);
    }

    try {
      const savedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
      if (savedLikes) {
        setLikedPackageIds(JSON.parse(savedLikes));
      }
    } catch {
      setLikedPackageIds([]);
    }
  }, []);

  // Keyboard shortcut for moderator mode (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdminModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSelectedPackage(null);
        setPackageToReport(null);
        setShowUploadModal(false);
        setShowAdminModal(false);
        setShowAndroidGuide(false);
        setPackageToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to Firestore real-time updates
  useEffect(() => {
    setIsLoading(true);

    // One-time auto-purge to guarantee a clean sheet / blank slate clear of any sample questions
    const PURGE_KEY = 'examforge_clean_slate_purged_v1';
    if (!localStorage.getItem(PURGE_KEY)) {
      purgeAllPackagesFromFirestore()
        .then(() => {
          localStorage.setItem(PURGE_KEY, 'true');
          console.log('Clean slate: Purged all legacy sample questions from repository.');
        })
        .catch((err) => {
          console.warn('Initial purge check encountered:', err);
        });
    }

    const unsubscribe = subscribeToExamPackages(
      (data) => {
        setPackages(data);
        setIsLoading(false);
        setDbError(null);

        // Check if direct packageId is requested in URL search params
        const params = new URLSearchParams(window.location.search);
        const pkgParam = params.get('pkg');
        if (pkgParam && !selectedPackage) {
          const match = data.find((p) => p.packageId === pkgParam || p.id === pkgParam);
          if (match) {
            setSelectedPackage(match);
          }
        }
      },
      (error) => {
        setIsLoading(false);
        setDbError(error.message || 'Failed to connect to database');
        addToast('Database connection issue. Showing available cached items.', 'error');
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle purging entire catalog
  const handlePurgeAllPackages = async () => {
    try {
      const count = await purgeAllPackagesFromFirestore();
      setPackages([]);
      addToast(`Catalog purged. ${count} item(s) wiped. Clean blank slate ready.`, 'success');
    } catch (err: any) {
      console.error('Purge error:', err);
      addToast(`Purge failed: ${err.message || 'Error'}`, 'error');
      throw err;
    }
  };

  // Handle saving new username
  const handleSaveUsername = (newName: string) => {
    setUsername(newName);
    localStorage.setItem(USERNAME_STORAGE_KEY, newName);
    setShowUsernameModal(false);
    setIsFirstVisit(false);
    addToast(`Username set to @${newName}`, 'success');
  };

  // Handle uploading package
  const handleUploadSuccess = async (pkg: ExamForgePackage) => {
    try {
      const docId = await uploadPackageToFirestore(pkg, username);
      addToast(`Package "${pkg.title}" published successfully!`, 'success');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      addToast(`Upload failed: ${err.message || 'Firestore error'}`, 'error');
    }
  };

  // Handle like toggle
  const handleToggleLike = async (pkg: ForumPackageDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedPackageIds.includes(pkg.id);
    const newLiked = !isCurrentlyLiked;

    // Update local state optimistically
    const updatedIds = newLiked
      ? [...likedPackageIds, pkg.id]
      : likedPackageIds.filter((id) => id !== pkg.id);

    setLikedPackageIds(updatedIds);
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(updatedIds));

    // Update state item optimistically
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkg.id
          ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) + (newLiked ? 1 : -1)) }
          : p
      )
    );

    if (selectedPackage && selectedPackage.id === pkg.id) {
      setSelectedPackage((prev) =>
        prev
          ? { ...prev, likeCount: Math.max(0, (prev.likeCount ?? 0) + (newLiked ? 1 : -1)) }
          : null
      );
    }

    try {
      await toggleLikeInFirestore(pkg.id, newLiked);
      if (newLiked) {
        addToast(`Liked "${pkg.title}"`, 'success');
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  // Handle tracking download count
  const handleTrackDownload = (pkg: ForumPackageDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkg.id ? { ...p, downloadCount: (p.downloadCount ?? 0) + 1 } : p
      )
    );
    if (selectedPackage && selectedPackage.id === pkg.id) {
      setSelectedPackage((prev) =>
        prev ? { ...prev, downloadCount: (prev.downloadCount ?? 0) + 1 } : null
      );
    }
    trackDownloadInFirestore(pkg.id);
  };

  // Handle admin deletion
  const handleTriggerDelete = (packageId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackageToDelete({ id: packageId, title });
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    try {
      await deletePackageFromFirestore(packageToDelete.id);
      addToast(`Post "${packageToDelete.title}" deleted by moderator`, 'info');
      if (selectedPackage?.id === packageToDelete.id) {
        setSelectedPackage(null);
      }
      setPackageToDelete(null);
    } catch (err: any) {
      addToast(`Delete failed: ${err.message || 'Firestore error'}`, 'error');
    }
  };

  // Collect all unique tags across packages
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    packages.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet).sort();
  }, [packages]);

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = pkg.title?.toLowerCase().includes(q);
        const codeMatch = pkg.courseCode?.toLowerCase().includes(q);
        const descMatch = pkg.description?.toLowerCase().includes(q);
        const instMatch = pkg.institution?.toLowerCase().includes(q);
        const authorMatch = pkg.author?.toLowerCase().includes(q);
        const tagMatch = pkg.tags?.some((t) => t.toLowerCase().includes(q));
        const questionPromptMatch =
          pkg.mcqQuestions?.some((m) => m.prompt?.toLowerCase().includes(q)) ||
          pkg.essayQuestions?.some((e) => e.prompt?.toLowerCase().includes(q));

        if (!titleMatch && !codeMatch && !descMatch && !instMatch && !authorMatch && !tagMatch && !questionPromptMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'All Categories') {
        if (pkg.category !== selectedCategory) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag) {
        if (!pkg.tags?.includes(selectedTag)) {
          return false;
        }
      }

      // Question type filter
      if (typeFilter === 'has_mcq' && (!pkg.mcqQuestions || pkg.mcqQuestions.length === 0)) {
        return false;
      }
      if (typeFilter === 'has_essay' && (!pkg.essayQuestions || pkg.essayQuestions.length === 0)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.postedAt || b.exportedAt || 0) - (a.postedAt || a.exportedAt || 0);
      }
      if (sortBy === 'most_liked') {
        return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      }
      if (sortBy === 'most_downloaded') {
        return (b.downloadCount ?? 0) - (a.downloadCount ?? 0);
      }
      if (sortBy === 'most_questions') {
        const countA = (a.mcqQuestions?.length || 0) + (a.essayQuestions?.length || 0);
        const countB = (b.mcqQuestions?.length || 0) + (b.essayQuestions?.length || 0);
        return countB - countA;
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [packages, searchQuery, selectedCategory, selectedTag, typeFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All Categories' || selectedTag !== '' || typeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedTag('');
    setTypeFilter('all');
  };

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Header */}
      <Header
        username={username}
        onOpenUsernameModal={() => {
          setIsFirstVisit(false);
          setShowUsernameModal(true);
        }}
        onOpenUploadModal={() => setShowUploadModal(true)}
        onOpenAndroidGuide={() => setShowAndroidGuide(true)}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onExitAdmin={() => {
          setIsAdmin(false);
          addToast('Moderator mode disabled', 'info');
        }}
        packageCount={packages.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Search, Filter, and Sort Toolbar */}
        <section className="bg-[#0e1628]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          
          {/* Top Row: Search Input + Sort Dropdown */}
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages by title, course code (e.g. CS-301), tags, author, topics..."
                className="w-full bg-[#070b14] border border-slate-700/80 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Question Type Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Sort Control */}
              <div className="flex items-center gap-1.5 bg-[#070b14] border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 whitespace-nowrap">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-400 hidden sm:inline whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer py-1 whitespace-nowrap"
                >
                  <option value="newest" className="bg-[#0d1424]">Newest</option>
                  <option value="most_liked" className="bg-[#0d1424]">Most Liked</option>
                  <option value="most_downloaded" className="bg-[#0d1424]">Most Downloaded</option>
                  <option value="most_questions" className="bg-[#0d1424]">Most Questions</option>
                  <option value="title_asc" className="bg-[#0d1424]">Title (A-Z)</option>
                </select>
              </div>

              {/* Question Type Filter */}
              <div className="flex items-center bg-[#070b14] border border-slate-700/80 rounded-xl p-1 text-xs whitespace-nowrap">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                    typeFilter === 'all'
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Show all packages"
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">All</span>
                </button>
                <button
                  onClick={() => setTypeFilter('has_mcq')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                    typeFilter === 'has_mcq'
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Filter packages with multiple-choice questions"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="whitespace-nowrap">MCQ</span>
                </button>
                <button
                  onClick={() => setTypeFilter('has_essay')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                    typeFilter === 'has_essay'
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Filter packages with essay questions"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="whitespace-nowrap">Essay</span>
                </button>
              </div>
            </div>

          </div>

          {/* Category Chips Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            <span className="text-slate-400 font-semibold text-xs shrink-0 mr-1 flex items-center gap-1 whitespace-nowrap">
              <Filter className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Category:</span>
            </span>
            {POPULAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const CatIcon = getCategoryIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm shadow-cyan-950'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <CatIcon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="whitespace-nowrap">{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Popular Tag selector & active filters summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
                <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                <span>Tags:</span>
              </span>
              {allTags.slice(0, 8).map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? '' : tag)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                );
              })}
              {selectedTag && !allTags.slice(0, 8).includes(selectedTag) && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-700 inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>#{selectedTag}</span>
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 underline inline-flex items-center gap-1 ml-auto whitespace-nowrap"
              >
                <X className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">Reset Filters</span>
              </button>
            )}
          </div>

        </section>

        {/* Database Status Alert if error */}
        {dbError && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Database syncing note: {dbError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="underline hover:text-white inline-flex items-center gap-1 whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* Repository Grid or Loading/Empty State */}
        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading ExamForge packages repository...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-16 px-4 bg-[#0e1628]/50 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center mx-auto text-cyan-400">
              {hasActiveFilters ? (
                <Search className="w-6 h-6 text-slate-400" />
              ) : (
                <UploadCloud className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {hasActiveFilters ? 'No matching exam packages found' : 'Clean Slate: Forum Catalog Ready'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {hasActiveFilters
                  ? 'No packages match your search criteria. Try adjusting your query or resetting filters.'
                  : 'The question repository is clean and ready. Be the first to upload and share an ExamForge package (.json) with the community!'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Reset Filters</span>
                </button>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-950/40 transition whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Upload First Package</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Showing <strong className="text-white">{filteredPackages.length}</strong> {filteredPackages.length === 1 ? 'package' : 'packages'}
                </span>
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline whitespace-nowrap">
                Click any package to review questions & download JSON
              </span>
            </div>

            {/* Responsive Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id || pkg.packageId}
                  pkg={pkg}
                  onSelect={setSelectedPackage}
                  onToggleLike={handleToggleLike}
                  onTrackDownload={handleTrackDownload}
                  onReport={(reportedPkg) => setPackageToReport(reportedPkg)}
                  isLiked={likedPackageIds.includes(pkg.id)}
                  isAdmin={isAdmin}
                  onDelete={handleTriggerDelete}
                />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-6 sm:py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">ExamForge Hub</span>
            <span>— Academic Question Exchange & Repository</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setShowAndroidGuide(true)}
              className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android App Spec</span>
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-slate-600 hover:text-slate-400 transition"
              title="Moderation Console (Ctrl+Shift+A)"
            >
              Moderator Key
            </button>
          </div>
        </div>
      </footer>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <PackageDetailModal
          pkg={selectedPackage}
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onToggleLike={handleToggleLike}
          onTrackDownload={handleTrackDownload}
          isLiked={likedPackageIds.includes(selectedPackage.id)}
          isAdmin={isAdmin}
          username={username}
          onDelete={handleTriggerDelete}
          onReport={(pkg) => setPackageToReport(pkg)}
          onShowToast={addToast}
        />
      )}

      {/* Report Modal */}
      {packageToReport && (
        <ReportModal
          pkg={packageToReport}
          isOpen={!!packageToReport}
          onClose={() => setPackageToReport(null)}
          username={username}
          onShowToast={addToast}
        />
      )}

      {/* Upload Package Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        username={username}
        onShowToast={addToast}
      />

      {/* Admin Mode Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => setIsAdmin(true)}
        isAdmin={isAdmin}
        onPurgeCatalog={handlePurgeAllPackages}
        onShowToast={addToast}
        onInspectPackage={(packageId) => {
          const found = packages.find((p) => p.id === packageId || p.packageId === packageId);
          if (found) {
            setSelectedPackage(found);
          } else {
            addToast('Package may have already been removed or not found.', 'info');
          }
        }}
      />

      {/* Username Configuration Modal */}
      <UsernameModal
        isOpen={showUsernameModal}
        currentUsername={username}
        onSave={handleSaveUsername}
        onClose={() => setShowUsernameModal(false)}
        isFirstVisit={isFirstVisit}
      />

      {/* Android Companion App Info Modal */}
      <AndroidInfoModal
        isOpen={showAndroidGuide}
        onClose={() => setShowAndroidGuide(false)}
      />

      {/* Moderator Delete Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0e1628] border border-rose-600/60 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Package Post?</h3>
                <p className="text-xs text-slate-400">Moderator action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              Are you sure you want to permanently delete <strong className="text-white">"{packageToDelete.title}"</strong> from the public forum?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
