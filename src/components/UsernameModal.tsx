import React, { useState } from 'react';
import { User, Sparkles, X, Check } from 'lucide-react';
import { DEFAULT_USERNAMES } from '../lib/constants';

interface UsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  onSave: (name: string) => void;
  onClose?: () => void;
  isFirstVisit?: boolean;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  currentUsername,
  onSave,
  onClose,
  isFirstVisit = false,
}) => {
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const randomBase = DEFAULT_USERNAMES[Math.floor(Math.random() * DEFAULT_USERNAMES.length)];
    const randomNum = Math.floor(Math.random() * 899) + 100;
    setUsernameInput(`${randomBase}${randomNum}`);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!clean || clean.length < 2) {
      setError('Please choose a username with at least 2 characters.');
      return;
    }
    if (clean.length > 24) {
      setError('Username cannot exceed 24 characters.');
      return;
    }
    onSave(clean);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">
      <div className="relative w-full sm:max-w-md bg-[#0e1628] border border-cyan-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {isFirstVisit ? 'Welcome!' : 'Update Username'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {isFirstVisit ? 'Choose a username to continue' : 'Your display handle'}
              </p>
            </div>
          </div>
          {!isFirstVisit && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="e.g. QuantumScholar"
                className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none transition"
              />
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 text-xs font-medium shrink-0 flex items-center gap-1 transition"
                title="Generate Random Username"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Random</span>
              </button>
            </div>
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            Your username is saved locally and attached to your uploads and activity.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            {!isFirstVisit && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-950/40 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isFirstVisit ? 'Enter' : 'Save'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
