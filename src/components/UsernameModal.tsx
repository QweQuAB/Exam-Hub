import React, { useState, useEffect } from 'react';
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
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(`${vh}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

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
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, height: viewportHeight, zIndex: 99999, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)'}} onClick={onClose}></div>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#0e1628', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        
        {/* Header */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1e293b', background: '#0a101d', flexShrink: 0}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0}}>
            <div style={{padding: '8px', borderRadius: '10px', background: '#164e63', border: '1px solid #155e75', color: '#22d3ee', flexShrink: 0}}>
              <User style={{width: '20px', height: '20px'}} />
            </div>
            <div style={{minWidth: 0}}>
              <h2 style={{fontSize: '15px', fontWeight: 'bold', color: 'white', margin: 0}}>
                {isFirstVisit ? 'Welcome!' : 'Update Username'}
              </h2>
              <p style={{fontSize: '11px', color: '#94a3b8', margin: 0}}>
                {isFirstVisit ? 'Choose a username to continue' : 'Your display handle'}
              </p>
            </div>
          </div>
          {!isFirstVisit && onClose && (
            <button
              onClick={onClose}
              style={{padding: '8px', color: '#94a3b8', background: '#1e293b', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '8px'}}
            >
              <X style={{width: '16px', height: '16px'}} />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSave} style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto'}}>
          <div>
            <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px'}}>
              Display Username
            </label>
            <div style={{display: 'flex', gap: '8px'}}>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="e.g. QuantumScholar"
                style={{flex: 1, background: '#070b14', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: '#e2e8f0', fontFamily: 'monospace', outline: 'none'}}
              />
              <button
                type="button"
                onClick={handleGenerateRandom}
                style={{padding: '12px 16px', background: '#1e293b', color: '#67e8f9', borderRadius: '12px', border: '1px solid #334155', fontSize: '13px', fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}
                title="Generate Random Username"
              >
                <Sparkles style={{width: '14px', height: '14px', color: '#fbbf24'}} />
                <span>Random</span>
              </button>
            </div>
            {error && <p style={{fontSize: '12px', color: '#fb7185', marginTop: '8px'}}>{error}</p>}
          </div>

          <p style={{fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b'}}>
            Your username is saved locally and attached to your uploads and activity.
          </p>

          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px'}}>
            {!isFirstVisit && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{padding: '12px 20px', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', background: '#1e293b', borderRadius: '10px', border: 'none', cursor: 'pointer'}}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, color: 'white', background: '#0891b2', borderRadius: '10px', border: 'none', cursor: 'pointer'}}
            >
              <Check style={{width: '18px', height: '18px'}} />
              <span>{isFirstVisit ? 'Enter' : 'Save'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};