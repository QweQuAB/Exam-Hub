import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Plus, 
  Smartphone, 
  User, 
  ShieldCheck,
  Key,
  Layers,
  Sun,
  Moon,
  Menu,
  RotateCw
} from 'lucide-react';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
  username: string;
  onOpenUsernameModal: () => void;
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
  isAdmin,
  onOpenAdminModal,
  onExitAdmin,
  packageCount,
  theme,
  onToggleTheme,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            
            {/* Logo and Brand - Compact for mobile */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-accent/40 shrink-0">
                <div className="w-full h-full bg-surface rounded-[7px] sm:rounded-[9px] flex items-center justify-center transition-colors">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-bold text-sm sm:text-lg tracking-tight text-fg flex items-center gap-1 whitespace-nowrap">
                    ExamForge <span className="text-accent font-extrabold">Hub</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent/10 text-accent border border-accent/30 whitespace-nowrap">
                    <Smartphone className="w-3 h-3 text-accent-emerald shrink-0" />
                    <span>v1.0 Ready</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-fg-muted hidden sm:flex items-center gap-1.5 whitespace-nowrap">
                  <Layers className="w-3 h-3 text-fg-dim shrink-0" />
                  <span>Repository • {packageCount} {packageCount === 1 ? 'Package' : 'Packages'}</span>
                </p>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-2.5 shrink-0">
              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-fg-secondary hover:text-accent bg-muted/80 hover:bg-muted border border-line-strong/80 rounded-lg transition-all active:scale-95"
                title="Refresh app"
                aria-label="Refresh app"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className="p-2 px-2.5 py-2 text-fg-secondary hover:text-accent bg-muted/80 hover:bg-muted border border-line-strong/80 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Light and Dark Mode"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-accent-amber animate-fadeIn" />
                    <span className="text-xs font-medium text-fg-secondary">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600 animate-fadeIn" />
                    <span className="text-xs font-medium text-fg-dim">Dark</span>
                  </>
                )}
              </button>

              {/* Android Companion guide button */}
              <button
                onClick={() => navigate('/android')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-fg-secondary hover:text-fg bg-muted/60 hover:bg-muted border border-line-strong/60 rounded-lg transition whitespace-nowrap"
                title="ExamForge Android Companion App Spec"
                aria-label="Android App Spec"
              >
                <Smartphone className="w-4 h-4 text-accent-emerald shrink-0" />
                <span className="whitespace-nowrap">Android Spec</span>
              </button>

              {/* Admin status badge or trigger */}
              {isAdmin ? (
                <div className="flex items-center gap-1.5 bg-accent-amber/10 border border-accent-amber/30 px-2.5 py-1.5 rounded-lg text-xs text-accent-amber whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-accent-amber shrink-0" />
                  <span className="font-semibold whitespace-nowrap">Mod Mode</span>
                  <button
                    onClick={onExitAdmin}
                    className="ml-1 text-fg-muted hover:text-fg underline text-[11px] whitespace-nowrap"
                    title="Disable Moderator mode"
                  >
                    Exit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/admin')}
                  className="p-2 text-fg-dim hover:text-fg-secondary transition rounded-lg hover:bg-muted/40 shrink-0"
                  title="Moderator Access (Ctrl+Shift+A)"
                  aria-label="Moderator Access"
                >
                  <Key className="w-4 h-4 opacity-70 hover:opacity-100 transition" />
                </button>
              )}

              {/* Username display / selector */}
              <button
                onClick={onOpenUsernameModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-fg-secondary hover:text-accent bg-page/80 hover:bg-muted border border-line-strong/80 rounded-lg transition whitespace-nowrap"
                title={`Active handle: @${username || 'Anonymous'}`}
              >
                <User className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="max-w-[130px] truncate font-mono text-xs whitespace-nowrap">
                  {username || 'Handle'}
                </span>
              </button>

              {/* Upload Package CTA */}
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-fg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-accent/20 transition transform active:scale-95 whitespace-nowrap"
                title="Upload New ExamForge Package"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Upload</span>
              </button>
            </div>

            {/* Mobile Refresh + Menu Buttons */}
            <div className="flex md:hidden items-center shrink-0 gap-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-fg-secondary hover:text-accent bg-muted/80 hover:bg-muted border border-line-strong/80 rounded-lg transition-all active:scale-95"
                title="Refresh app"
                aria-label="Refresh app"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-fg-secondary hover:text-accent bg-muted/80 hover:bg-muted border border-line-strong/80 rounded-lg transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        username={username}
        onOpenUsernameModal={onOpenUsernameModal}
        isAdmin={isAdmin}
        onOpenAdminModal={onOpenAdminModal}
        onExitAdmin={onExitAdmin}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </>
  );
};

