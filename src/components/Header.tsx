import React from 'react';
import { 
  GraduationCap, 
  Plus, 
  Smartphone, 
  User, 
  ShieldCheck,
  Key,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  username: string;
  onOpenUsernameModal: () => void;
  onOpenUploadModal: () => void;
  onOpenAndroidGuide: () => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onExitAdmin: () => void;
  packageCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  username,
  onOpenUsernameModal,
  onOpenUploadModal,
  onOpenAndroidGuide,
  isAdmin,
  onOpenAdminModal,
  onExitAdmin,
  packageCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 sm:space-x-3.5 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-950/40 shrink-0">
              <div className="w-full h-full bg-white dark:bg-[#0d1527] rounded-[10px] flex items-center justify-center transition-colors">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1 whitespace-nowrap">
                  ExamForge <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">Hub</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 whitespace-nowrap">
                  <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>v1.0 Ready</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5 whitespace-nowrap">
                <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>Repository • {packageCount} {packageCount === 1 ? 'Package' : 'Packages'}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            
            {/* Theme Toggle (Light / Dark mode) */}
            <button
              onClick={onToggleTheme}
              className="p-2 sm:px-2.5 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Light and Dark Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
                  <span className="hidden lg:inline text-xs font-medium text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 animate-fadeIn" />
                  <span className="hidden lg:inline text-xs font-medium text-slate-700">Dark</span>
                </>
              )}
            </button>

            {/* Android Companion guide button */}
            <button
              onClick={onOpenAndroidGuide}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg transition whitespace-nowrap"
              title="ExamForge Android Companion App Spec"
              aria-label="Android App Spec"
            >
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Android Spec</span>
            </button>

            {/* Admin status badge or trigger */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-600/60 px-2.5 py-1.5 rounded-lg text-xs text-amber-800 dark:text-amber-300 whitespace-nowrap">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline font-semibold whitespace-nowrap">Mod Mode</span>
                <button
                  onClick={onExitAdmin}
                  className="ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline text-[11px] whitespace-nowrap"
                  title="Disable Moderator mode"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 shrink-0"
                title="Moderator Access (Ctrl+Shift+A)"
                aria-label="Moderator Access"
              >
                <Key className="w-4 h-4 opacity-70 hover:opacity-100 transition" />
              </button>
            )}

            {/* Username display / selector */}
            <button
              onClick={onOpenUsernameModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-lg transition whitespace-nowrap"
              title={`Active handle: @${username || 'Anonymous'}`}
            >
              <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="max-w-[80px] sm:max-w-[130px] truncate font-mono text-xs whitespace-nowrap">
                {username || 'Handle'}
              </span>
            </button>

            {/* Upload Package CTA */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-900/20 dark:shadow-cyan-900/30 transition transform active:scale-95 whitespace-nowrap"
              title="Upload New ExamForge Package"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Upload</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

