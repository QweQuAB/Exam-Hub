import React, { useState, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [customCategory, setCustomCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorName, setAuthorName] = useState(username || 'Contributor');
  const [authorRole, setAuthorRole] = useState('Educator');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="fixed inset-0 z-[100] overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal - pinned to top */}
      <div className="relative min-h-screen flex flex-col">
        <div className="w-full bg-[#0e1628] border-b border-slate-700/90 shadow-2xl animate-slideDown">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0" />
              <h2 className="text-sm font-bold text-white truncate">Upload Package</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 space-y-4" style={{maxHeight: 'calc(100vh - 120px)'}}>
            
            {!parsedPackage ? (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('file')}
                    className={`py-2 px-3 border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'file'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>File</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`py-2 px-3 border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'paste'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-4 h-4 shrink-0" />
                    <span>Paste JSON</span>
                  </button>
                  <button
                    onClick={loadSampleTemplate}
                    className="ml-auto py-2 px-2 text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 transition whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Sample</span>
                  </button>
                </div>

                {/* File Upload */}
                {activeTab === 'file' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/40'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,application/json"
                      className="hidden"
                    />
                    <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-90" />
                    <p className="text-sm font-semibold text-white mb-1">Tap to select JSON file</p>
                    <p className="text-xs text-slate-400 mb-3">.json format only</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800">
                      Select File
                    </span>
                  </div>
                )}

                {/* Paste JSON */}
                {activeTab === 'paste' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Paste ExamForge JSON:</span>
                      {jsonText && (
                        <button onClick={() => setJsonText('')} className="text-rose-400 hover:underline">Clear</button>
                      )}
                    </div>
                    <textarea
                      value={jsonText}
                      onChange={handlePasteChange}
                      placeholder={'{\n  "formatIdentifier": "EXAMFORGE_PACKAGE",\n  ...\n}'}
                      rows={8}
                      className="w-full bg-[#070b14] border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none transition resize-none"
                    />
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1 text-xs text-rose-200">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Invalid ({validationErrors.length} issues)</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] max-h-28 overflow-y-auto">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Success Banner */}
                <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Verified: {parsedPackage.title}</span>
                  </div>
                  <button onClick={resetUpload} className="text-xs text-slate-400 hover:text-white underline shrink-0 ml-2">
                    Change
                  </button>
                </div>

                {/* Package Summary */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {parsedPackage.courseCode && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        {parsedPackage.courseCode}
                      </span>
                    )}
                    {parsedPackage.institution && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {parsedPackage.institution}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{parsedPackage.title}</h3>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {parsedPackage.mcqQuestions?.length || 0} MCQ
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900">
                      <FileQuestion className="w-3 h-3 shrink-0" />
                      {parsedPackage.essayQuestions?.length || 0} Essay
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
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
                        className="mt-2 w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Midterm, Final, Chapter4"
                      className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Prof. Smith"
                        className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                      <input
                        type="text"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        placeholder="Professor"
                        className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-800 bg-[#0a101d] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            {parsedPackage && (
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-lg shadow-md shadow-cyan-950/40 transition active:scale-95"
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};