import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  User, 
  Plus, 
  Smartphone, 
  ShieldCheck, 
  Key, 
  Sun, 
  Moon,
  Settings,
  Info,
  RotateCw
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onOpenUsernameModal: () => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onExitAdmin: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  username,
  onOpenUsernameModal,
  isAdmin,
  onOpenAdminModal,
  onExitAdmin,
  theme,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-surface border-l border-line shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5">
              <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                <span className="text-accent text-sm font-bold">EF</span>
              </div>
            </div>
            <span className="font-bold text-fg">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fg-muted hover:text-fg hover:bg-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="p-4 space-y-3">
          {/* User Profile */}
          <button
            onClick={() => {
              onOpenUsernameModal();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg truncate">@{username || 'Anonymous'}</p>
              <p className="text-xs text-fg-muted">Change username</p>
            </div>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => {
              onClose();
              navigate('/upload');
            }}
            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl transition text-fg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Upload Package</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-accent-amber" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-sm text-fg-secondary">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Refresh App */}
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition"
          >
            <RotateCw className="w-5 h-5 text-accent" />
            <span className="text-sm text-fg-secondary">Refresh App</span>
          </button>

          {/* Android Guide */}
          <button
            onClick={() => {
              onClose();
              navigate('/android');
            }}
            className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition"
          >
            <Smartphone className="w-5 h-5 text-accent-emerald" />
            <span className="text-sm text-fg-secondary">Android App Spec</span>
          </button>

          {/* Admin Access */}
          {isAdmin ? (
            <div className="flex items-center justify-between p-3 bg-accent-amber/10 border border-accent-amber/30 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent-amber" />
                <span className="text-sm text-accent-amber font-medium">Moderator Mode</span>
              </div>
              <button
                onClick={() => {
                  onExitAdmin();
                  onClose();
                }}
                className="text-xs text-accent-amber hover:text-accent-amber/80 underline"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition"
            >
              <Key className="w-5 h-5 text-fg-muted" />
              <span className="text-sm text-fg-secondary">Moderator Access</span>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-line my-4"></div>

          {/* Info Section */}
          <div className="p-3 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-fg-muted" />
              <span className="text-xs font-medium text-fg-secondary">About ExamForge Hub</span>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              Academic question package repository for sharing and downloading exam materials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};