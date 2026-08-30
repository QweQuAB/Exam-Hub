import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ForumPackageDocument, SortOption, FilterState } from './types';
import {
  subscribeToExamPackages,
  toggleLikeInFirestore,
  trackDownloadInFirestore,
  deletePackageFromFirestore,
  purgeAllPackagesFromFirestore,
} from './lib/firebase';
import { POPULAR_CATEGORIES, DEFAULT_USERNAMES } from './lib/constants';
import { getCategoryIcon } from './lib/categoryIcons';
import { Header } from './components/Header';
import { PackageCard } from './components/PackageCard';
import { UsernameModal } from './components/UsernameModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const USERNAME_STORAGE_KEY = 'examforge_hub_username';
const LIKES_STORAGE_KEY = 'examforge_hub_liked_ids';

export default function App() {
  const navigate = useNavigate();
  
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

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('examforge_theme', newTheme);
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

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('examforge_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(initialTheme);
    }
  }, []);

  // Keyboard shortcut for moderator mode (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Listen to Firestore real-time updates
  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = subscribeToExamPackages(
      (data) => {
        setPackages(data);
        setIsLoading(false);
        setDbError(null);
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
    trackDownloadInFirestore(pkg.id);
  };

  // Handle admin deletion
  const handleTriggerDelete = (packageId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      confirmDelete(packageId, title);
    }
  };

  const confirmDelete = async (packageId: string, title: string) => {
    try {
      await deletePackageFromFirestore(packageId);
      addToast(`Post "${title}" deleted by moderator`, 'info');
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
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Header */}
      <Header
        username={username}
        onOpenUsernameModal={() => {
          setIsFirstVisit(false);
          setShowUsernameModal(true);
        }}
        isAdmin={isAdmin}
        onOpenAdminModal={() => navigate('/admin')}
        onExitAdmin={() => {
          setIsAdmin(false);
          addToast('Moderator mode disabled', 'info');
        }}
        packageCount={packages.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        
        {/* Search, Filter, and Sort Toolbar - Mobile Optimized */}
        <section className="bg-[#0e1628]/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
          
          {/* Search Bar - Full width on mobile */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages by title, course code, tags, author..."
              className="w-full bg-[#070b14] border border-slate-700/80 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
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

          {/* Sort & Question Type Filter Controls - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-[#070b14] border border-slate-700/80 rounded-xl px-3 py-2 whitespace-nowrap flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-400 whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer py-1 whitespace-nowrap flex-1"
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
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

          {/* Category Chips - Scrollable on mobile */}
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

          {/* Active filters summary - Compact on mobile */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
                  <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Tags:</span>
                </span>
                {allTags.slice(0, 4).map((tag) => {
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
              </div>
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 underline inline-flex items-center gap-1 ml-auto whitespace-nowrap"
              >
                <X className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">Reset</span>
              </button>
            </div>
          )}

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
                onClick={() => navigate('/upload')}
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

            {/* Responsive Card Grid - Single column on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id || pkg.packageId}
                  pkg={pkg}
                  onSelect={(p) => navigate(`/package/${p.id || p.packageId}`)}
                  onToggleLike={handleToggleLike}
                  onTrackDownload={handleTrackDownload}
                  onReport={(reportedPkg) => navigate(`/report/${reportedPkg.id || reportedPkg.packageId}`)}
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
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-4 sm:py-6 mt-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">ExamForge Hub</span>
            <span>— Academic Question Exchange</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => navigate('/android')}
              className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Spec</span>
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="text-slate-600 hover:text-slate-400 transition"
              title="Moderation Console (Ctrl+Shift+A)"
            >
              Moderator
            </button>
          </div>
        </div>
      </footer>

      {/* Username Configuration Modal - kept as modal since it's quick */}
      <UsernameModal
        isOpen={showUsernameModal}
        currentUsername={username}
        onSave={handleSaveUsername}
        onClose={() => setShowUsernameModal(false)}
        isFirstVisit={isFirstVisit}
      />

    </div>
  );
}
