import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Trash2, 
  Code, 
  HelpCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  FileQuestion,
  GraduationCap,
  Building2,
  Tag,
  User
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

  // Form override fields for category/tags/author if desired
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
        onShowToast('Package validated successfully!', 'success');
      } else {
        setParsedPackage(null);
        setValidationErrors(validation.errors);
      }
    } catch (err: any) {
      setParsedPackage(null);
      setValidationErrors([`JSON Syntax Error: ${err.message || 'Malformed JSON syntax'}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setValidationErrors(['Please upload a valid .json file.']);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setValidationErrors(['Please upload a valid .json file.']);
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
    processJsonData(formatted, 'Starter_ExamForge_Template.json');
  };

  const handlePublish = async () => {
    if (!parsedPackage) return;

    setIsSubmitting(true);
    try {
      // Process tags
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
      setValidationErrors([`Failed to upload package: ${err.message || 'Unknown error'}`]);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e1628] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0a101d] flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>Upload ExamForge Package</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Share an exam package (.json) with students and educators on the forum.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* If no valid package yet, show upload options */}
          {!parsedPackage ? (
            <div className="space-y-4">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 text-xs font-semibold overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`py-2.5 px-4 border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'file'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`py-2.5 px-4 border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap ${
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
                  className="ml-auto text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 transition whitespace-nowrap py-2.5 px-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Load Sample</span>
                </button>
              </div>

              {/* File Upload Zone */}
              {activeTab === 'file' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-90 animate-pulse" />
                  <p className="text-sm font-semibold text-white mb-1">
                    Drag & Drop your ExamForge JSON file here
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    or click to browse your computer (.json format only)
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800">
                    Select JSON File
                  </span>
                </div>
              )}

              {/* Paste JSON Tab */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Paste valid ExamForge JSON payload:</span>
                    {jsonText && (
                      <button
                        onClick={() => setJsonText('')}
                        className="text-rose-400 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={handlePasteChange}
                    placeholder={`{\n  "formatIdentifier": "EXAMFORGE_PACKAGE",\n  "schemaVersion": 1,\n  "title": "My Final Exam",\n  ...\n}`}
                    rows={10}
                    className="w-full bg-[#070b14] border border-slate-800 focus:border-cyan-500 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none transition"
                  />
                </div>
              )}

              {/* Validation Errors Box */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2 text-xs text-rose-200">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Invalid Package Format ({validationErrors.length} issues)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] max-h-36 overflow-y-auto">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Tip: Packages must have <code>formatIdentifier: "EXAMFORGE_PACKAGE"</code> and required question fields matching the ExamForge Android specification.
                  </p>
                </div>
              )}

            </div>
          ) : (
            /* Valid Package Details & Final Confirmation */
            <div className="space-y-5">
              
              {/* Validation Success Banner */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Schema Verified: {parsedPackage.title}</span>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-xs text-slate-400 hover:text-white underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  <span>Change File</span>
                </button>
              </div>

              {/* Package Summary Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 whitespace-nowrap">
                    <GraduationCap className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{parsedPackage.courseCode || 'No Course Code'}</span>
                  </span>
                  {parsedPackage.institution && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{parsedPackage.institution}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">
                  {parsedPackage.title}
                </h3>

                {parsedPackage.description && (
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {parsedPackage.description}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>{parsedPackage.mcqQuestions?.length || 0} MCQ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900 whitespace-nowrap">
                    <FileQuestion className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{parsedPackage.essayQuestions?.length || 0} Essay</span>
                  </span>
                </div>
              </div>

              {/* Metadata Customization Form (Category, Tags, Author) */}
              <div className="space-y-4 pt-1">
                
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {POPULAR_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Category)</option>
                  </select>

                  {selectedCategory === 'Other' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Environmental Law"
                      className="mt-2 w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Midterm, Algorithms, Chapter4, FinalPrep"
                    className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                {/* Author Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Package Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Prof. Smith or Anonymous"
                      className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Author Role / Title
                    </label>
                    <input
                      type="text"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      placeholder="e.g. Professor, TA, Student Contributor"
                      className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a101d] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition whitespace-nowrap"
          >
            Cancel
          </button>

          {parsedPackage && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-lg shadow-md shadow-cyan-950/40 transition active:scale-95 whitespace-nowrap"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish to Forum'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
