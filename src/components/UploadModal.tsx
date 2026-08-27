import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Code, 
  FileQuestion,
  GraduationCap,
  Building2
} from 'lucide-react';
import { ExamForgePackage } from '../types';
import { validateExamForgePackage } from '../lib/validation';
import { POPULAR_CATEGORIES } from '../lib/constants';
import { STARTER_PACKAGE_TEMPLATE } from '../lib/templates';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (pkg: ExamForgePackage) => void;
  username: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  username,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedPackage, setParsedPackage] = useState<ExamForgePackage | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [customCategory, setCustomCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorName, setAuthorName] = useState(username || 'Contributor');
  const [authorRole, setAuthorRole] = useState('Educator');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate proper viewport height for mobile apps
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

  const processJsonData = (rawString: string, originName?: string) => {
    setValidationErrors([]);
    try {
      const parsed = JSON.parse(rawString);
      const validation = validateExamForgePackage(parsed);

      if (validation.valid && validation.package) {
        const pkg = validation.package;
        setParsedPackage(pkg);
        setFileName(originName || 'pasted_package.json');
        setSelectedCategory(pkg.category || 'General');
        setTagsInput(pkg.tags ? pkg.tags.join(', ') : '');
        setAuthorName(pkg.author || username || 'Anonymous');
        setAuthorRole(pkg.authorRole || 'Contributor');
        onShowToast('Package validated!', 'success');
      } else {
        setParsedPackage(null);
        setValidationErrors(validation.errors);
      }
    } catch (err: any) {
      setParsedPackage(null);
      setValidationErrors([`JSON Error: ${err.message || 'Malformed JSON'}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setValidationErrors(['Please upload a .json file.']);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      processJsonData(content, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    if (val.trim()) {
      processJsonData(val, 'Pasted JSON');
    } else {
      setParsedPackage(null);
      setValidationErrors([]);
    }
  };

  const loadSampleTemplate = () => {
    const formatted = JSON.stringify(STARTER_PACKAGE_TEMPLATE, null, 2);
    setJsonText(formatted);
    processJsonData(formatted, 'Starter_Template.json');
  };

  const handlePublish = async () => {
    if (!parsedPackage) return;
    setIsSubmitting(true);
    try {
      const processedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const finalCategory =
        selectedCategory === 'Other' && customCategory.trim()
          ? customCategory.trim()
          : selectedCategory || 'General';

      const finalPackage: ExamForgePackage = {
        ...parsedPackage,
        category: finalCategory,
        tags: processedTags.length > 0 ? processedTags : parsedPackage.tags || ['ExamForge'],
        author: authorName.trim() || parsedPackage.author || 'Anonymous',
        authorRole: authorRole.trim() || parsedPackage.authorRole || 'Contributor',
        exportedAt: Date.now(),
      };

      onUploadSuccess(finalPackage);
      onClose();
    } catch (err: any) {
      setValidationErrors([`Upload failed: ${err.message || 'Error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUpload = () => {
    setJsonText('');
    setFileName('');
    setParsedPackage(null);
    setValidationErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: viewportHeight,
      zIndex: 99999,
      overflow: 'hidden'
    }}>
      {/* Dark background */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)'
        }} 
        onClick={onClose}
      ></div>
      
      {/* Modal content - pinned to top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0e1628',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
          background: '#0a101d',
          flexShrink: 0
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0}}>
            <UploadCloud style={{width: '22px', height: '22px', color: '#22d3ee', flexShrink: 0}} />
            <h2 style={{fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0}}>Upload Package</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              color: '#94a3b8',
              background: '#1e293b',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label="Close"
          >
            <X style={{width: '18px', height: '18px'}} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{overflowY: 'auto', flex: 1, padding: '16px', WebkitOverflowScrolling: 'touch'}}>
          
          {!parsedPackage ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {/* Tabs */}
              <div style={{display: 'flex', borderBottom: '1px solid #1e293b', fontSize: '13px', fontWeight: 600}}>
                <button
                  onClick={() => setActiveTab('file')}
                  style={{
                    padding: '10px 16px',
                    borderBottom: activeTab === 'file' ? '2px solid #22d3ee' : '2px solid transparent',
                    color: activeTab === 'file' ? '#67e8f9' : '#94a3b8',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileText style={{width: '18px', height: '18px'}} />
                  <span>File</span>
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  style={{
                    padding: '10px 16px',
                    borderBottom: activeTab === 'paste' ? '2px solid #22d3ee' : '2px solid transparent',
                    color: activeTab === 'paste' ? '#67e8f9' : '#94a3b8',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Code style={{width: '18px', height: '18px'}} />
                  <span>Paste JSON</span>
                </button>
                <button
                  onClick={loadSampleTemplate}
                  style={{
                    marginLeft: 'auto',
                    padding: '10px 12px',
                    color: '#94a3b8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <Sparkles style={{width: '16px', height: '16px', color: '#fbbf24'}} />
                  <span>Sample</span>
                </button>
              </div>

              {/* File Upload */}
              {activeTab === 'file' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #475569',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#0f172a',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    style={{display: 'none'}}
                  />
                  <UploadCloud style={{width: '48px', height: '48px', color: '#22d3ee', marginBottom: '12px'}} />
                  <p style={{fontSize: '15px', fontWeight: 600, color: 'white', margin: '0 0 6px'}}>Tap to select JSON file</p>
                  <p style={{fontSize: '13px', color: '#94a3b8', margin: '0 0 16px'}}>.json format only</p>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#67e8f9',
                    background: '#164e63',
                    border: '1px solid #155e75'
                  }}>
                    Select File
                  </span>
                </div>
              )}

              {/* Paste JSON */}
              {activeTab === 'paste' && (
                <div>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '13px', color: '#94a3b8'}}>Paste ExamForge JSON:</span>
                    {jsonText && (
                      <button onClick={() => setJsonText('')} style={{color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline'}}>Clear</button>
                    )}
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={handlePasteChange}
                    placeholder={'{\n  "formatIdentifier": "EXAMFORGE_PACKAGE",\n  ...\n}'}
                    rows={10}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      padding: '14px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      color: '#e2e8f0',
                      resize: 'none',
                      boxSizing: 'border-box',
                      minHeight: '180px'
                    }}
                  />
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(225, 29, 72, 0.15)',
                  border: '1px solid rgba(225, 29, 72, 0.5)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#fecdd3'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px'}}>
                    <AlertCircle style={{width: '18px', height: '18px', color: '#fb7185'}} />
                    <span>Invalid ({validationErrors.length} issues)</span>
                  </div>
                  <ul style={{margin: 0, paddingLeft: '20px', fontSize: '12px', maxHeight: '120px', overflowY: 'auto'}}>
                    {validationErrors.map((err, i) => (
                      <li key={i} style={{marginBottom: '4px'}}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {/* Success Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                background: 'rgba(5, 150, 105, 0.15)',
                border: '1px solid rgba(5, 150, 105, 0.4)',
                borderRadius: '12px',
                fontSize: '13px'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: '#6ee7b7', fontWeight: 600, minWidth: 0}}>
                  <CheckCircle2 style={{width: '18px', height: '18px', color: '#34d399', flexShrink: 0}} />
                  <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>Verified: {parsedPackage.title}</span>
                </div>
                <button onClick={resetUpload} style={{fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0, marginLeft: '10px'}}>
                  Change
                </button>
              </div>

              {/* Package Summary */}
              <div style={{background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px'}}>
                  {parsedPackage.courseCode && (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', color: '#67e8f9', background: '#164e63', padding: '4px 10px', borderRadius: '6px'}}>
                      <GraduationCap style={{width: '14px', height: '14px'}} />
                      {parsedPackage.courseCode}
                    </span>
                  )}
                  {parsedPackage.institution && (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8'}}>
                      <Building2 style={{width: '14px', height: '14px'}} />
                      {parsedPackage.institution}
                    </span>
                  )}
                </div>
                <h3 style={{fontSize: '15px', fontWeight: 'bold', color: 'white', margin: '0 0 10px'}}>{parsedPackage.title}</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b', fontSize: '13px', flexWrap: 'wrap'}}>
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #1e40af'}}>
                    <CheckCircle2 style={{width: '14px', height: '14px'}} />
                    {parsedPackage.mcqQuestions?.length || 0} MCQ
                  </span>
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#1e1b4b', color: '#a5b4fc', border: '1px solid #3730a3'}}>
                    <FileQuestion style={{width: '14px', height: '14px'}} />
                    {parsedPackage.essayQuestions?.length || 0} Essay
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px'}}>Category *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    boxSizing: 'border-box'
                  }}
                >
                  {POPULAR_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {selectedCategory === 'Other' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Custom category"
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '13px',
                      color: '#e2e8f0',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px'}}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Midterm, Final, Chapter4"
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px'}}>Author</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Prof. Smith"
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '13px',
                      color: '#e2e8f0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px'}}>Role</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="Professor"
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '13px',
                      color: '#e2e8f0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderTop: '1px solid #1e293b',
          background: '#0a101d',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#cbd5e1',
              background: '#1e293b',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          {parsedPackage && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(to right, #0891b2, #2563eb)',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              <UploadCloud style={{width: '18px', height: '18px'}} />
              <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};