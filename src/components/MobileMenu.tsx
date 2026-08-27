import React from 'react';
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
  Info
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onOpenUsernameModal: () => void;
  onOpenUploadModal: () => void;
  onOpenAndroidGuide: () => void;
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
  onOpenUploadModal,
  onOpenAndroidGuide,
  isAdmin,
  onOpenAdminModal,
  onExitAdmin,
  theme,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[#0c1322] border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5">
              <div className="w-full h-full bg-[#0d1527] rounded-[7px] flex items-center justify-center">
                <span className="text-cyan-400 text-sm font-bold">EF</span>
              </div>
            </div>
            <span className="font-bold text-white">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
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
            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">@{username || 'Anonymous'}</p>
              <p className="text-xs text-slate-400">Change username</p>
            </div>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => {
              onClose();
              setTimeout(() => onOpenUploadModal(), 100);
            }}
            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl transition text-white"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Upload Package</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-sm text-slate-200">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Android Guide */}
          <button
            onClick={() => {
              onOpenAndroidGuide();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
          >
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-200">Android App Spec</span>
          </button>

          {/* Admin Access */}
          {isAdmin ? (
            <div className="flex items-center justify-between p-3 bg-amber-950/50 border border-amber-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-amber-200 font-medium">Moderator Mode</span>
              </div>
              <button
                onClick={() => {
                  onExitAdmin();
                  onClose();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAdminModal();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
            >
              <Key className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-200">Moderator Access</span>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-slate-800 my-4"></div>

          {/* Info Section */}
          <div className="p-3 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">About ExamForge Hub</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Academic question package repository for sharing and downloading exam materials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};