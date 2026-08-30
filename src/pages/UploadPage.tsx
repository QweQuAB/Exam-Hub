import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Building2,
  ArrowLeft,
  FileSpreadsheet,
  FileType
} from 'lucide-react';
import { ExamForgePackage } from '../types';
import { validateExamForgePackage } from '../lib/validation';
import { POPULAR_CATEGORIES } from '../lib/constants';
import { STARTER_PACKAGE_TEMPLATE } from '../lib/templates';
import { uploadPackageToFirestore } from '../lib/firebase';

interface UploadPageProps {
  username: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Smart file parser - detects format and converts to ExamForgePackage
const parseSmartFile = (content: string, fileName: string): { data: any; format: string } | null => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Try JSON first
  if (ext === 'json' || ext === 'examforge' || content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      return { data: parsed, format: 'json' };
    } catch {}
  }

  // Try CSV
  if (ext === 'csv' || content.includes(',')) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length >= 2) {
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const questions: any[] = [];

      // Detect if it has question/answer columns
      const qIdx = headers.findIndex(h => h.includes('question') || h.includes('prompt'));
      const aIdx = headers.findIndex(h => h.includes('answer') || h.includes('correct'));
      const optIdx = headers.filter(h => h.includes('option') || h.includes('choice'));

      if (qIdx >= 0) {
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const question = cols[qIdx] || '';
          if (!question) continue;

          if (aIdx >= 0 && optIdx.length >= 2) {
            // MCQ format
            const options = optIdx.map(idx => cols[headers.indexOf(idx)] || '').filter(Boolean);
            const answer = cols[aIdx] || '';
            const correctIdx = options.findIndex(o =>
              o.toLowerCase() === answer.toLowerCase() ||
              o.toLowerCase().startsWith(answer.toLowerCase())
            );
            questions.push({
              id: `q-${Date.now()}-${i}`,
              questionType: 'mcq',
              prompt: question,
              options: options.length >= 2 ? options : ['Option A', 'Option B'],
              correctIndex: correctIdx >= 0 ? correctIdx : 0,
              position: i
            });
          } else {
            // Essay format
            questions.push({
              id: `q-${Date.now()}-${i}`,
              questionType: 'essay',
              prompt: question,
              options: [],
              correctIndex: null,
              position: i
            });
          }
        }

        if (questions.length > 0) {
          const title = fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
          return {
            data: {
              formatIdentifier: 'EXAMFORGE_PACKAGE',
              schemaVersion: 1,
              packageId: `pkg-${Date.now()}`,
              title: title.charAt(0).toUpperCase() + title.slice(1),
              courseCode: null,
              institution: null,
              description: `Imported from ${fileName}`,
              category: 'General',
              author: 'Imported',
              authorRole: 'Contributor',
              tags: ['imported', ext],
              exportedAt: Date.now(),
              mcqQuestions: questions.filter(q => q.questionType === 'mcq'),
              essayQuestions: questions.filter(q => q.questionType === 'essay')
            },
            format: 'csv'
          };
        }
      }
    }
  }

  // Try plain text (one question per line or numbered)
  if (ext === 'txt' || ext === 'text') {
    const lines = content.split('\n')
      .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(l => l.length > 5);

    if (lines.length > 0) {
      const questions = lines.map((line, i) => ({
        id: `q-${Date.now()}-${i}`,
        questionType: 'essay' as const,
        prompt: line,
        options: [],
        correctIndex: null,
        position: i + 1
      }));

      const title = fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      return {
        data: {
          formatIdentifier: 'EXAMFORGE_PACKAGE',
          schemaVersion: 1,
          packageId: `pkg-${Date.now()}`,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          courseCode: null,
          institution: null,
          description: `Imported from ${fileName} - ${lines.length} questions`,
          category: 'General',
          author: 'Imported',
          authorRole: 'Contributor',
          tags: ['imported', 'text'],
          exportedAt: Date.now(),
          mcqQuestions: [],
          essayQuestions: questions
        },
        format: 'text'
      };
    }
  }

  return null;
};

export const UploadPage: React.FC<UploadPageProps> = ({
  username,
  onShowToast,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedPackage, setParsedPackage] = useState<ExamForgePackage | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [customCategory, setCustomCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorName, setAuthorName] = useState(username || 'Contributor');
  const [authorRole, setAuthorRole] = useState('Educator');

  const processFileContent = (rawString: string, originName?: string) => {
    setValidationErrors([]);

    // Try smart parsing first
    const smartResult = parseSmartFile(rawString, originName || 'pasted.txt');
    if (smartResult) {
      const validation = validateExamForgePackage(smartResult.data);
      if (validation.valid && validation.package) {
        const pkg = validation.package;
        setParsedPackage(pkg);
        setFileName(originName || 'pasted_data');
        setDetectedFormat(smartResult.format.toUpperCase());
        setSelectedCategory(pkg.category || 'General');
        setTagsInput(pkg.tags ? pkg.tags.join(', ') : '');
        setAuthorName(pkg.author || username || 'Anonymous');
        setAuthorRole(pkg.authorRole || 'Contributor');
        onShowToast(`Detected ${smartResult.format.toUpperCase()} format`, 'success');
        return;
      } else {
        setValidationErrors(validation.errors);
        return;
      }
    }

    // Fallback to raw JSON
    try {
      const parsed = JSON.parse(rawString);
      const validation = validateExamForgePackage(parsed);

      if (validation.valid && validation.package) {
        const pkg = validation.package;
        setParsedPackage(pkg);
        setFileName(originName || 'pasted_package.json');
        setDetectedFormat('JSON');
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
      setValidationErrors([
        `Could not parse file. Supported formats: JSON, .examforge, CSV, TXT`,
        `Error: ${err.message || 'Invalid format'}`
      ]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const supported = ['json', 'csv', 'txt', 'text', 'examforge'];
    if (!supported.includes(ext || '')) {
      setValidationErrors(['Please upload a JSON, .examforge, CSV, or TXT file.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    if (val.trim()) {
      processFileContent(val, 'Pasted Content');
    } else {
      setParsedPackage(null);
      setValidationErrors([]);
    }
  };

  const loadSampleTemplate = () => {
    const formatted = JSON.stringify(STARTER_PACKAGE_TEMPLATE, null, 2);
    setJsonText(formatted);
    processFileContent(formatted, 'Starter_Template.json');
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

      await uploadPackageToFirestore(finalPackage, username);
      onShowToast('Package published successfully!', 'success');
      navigate('/');
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
    setDetectedFormat('');
  };

  return (
    <div style={{minHeight: '100vh', background: '#0e1628', display: 'flex', flexDirection: 'column'}}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#0a101d',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0}}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px',
              color: '#94a3b8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft style={{width: '20px', height: '20px'}} />
          </button>
          <UploadCloud style={{width: '22px', height: '22px', color: '#22d3ee', flexShrink: 0}} />
          <h2 style={{fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0}}>Upload Package</h2>
        </div>
        {detectedFormat && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#22d3ee',
            background: '#164e63',
            padding: '4px 10px',
            borderRadius: '6px'
          }}>
            {detectedFormat}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{flex: 1, overflowY: 'auto', padding: '16px', WebkitOverflowScrolling: 'touch'}}>

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
                <span>Paste</span>
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

            {/* Supported formats hint */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#67e8f9'
            }}>
              <FileType style={{width: '18px', height: '18px', flexShrink: 0}} />
              <span>Supports: <strong>JSON</strong> (ExamForge), <strong>.examforge</strong> (shared files), <strong>CSV</strong> (questions + answers), <strong>TXT</strong> (one question per line)</span>
            </div>

            {/* File Upload — label wraps the drop zone so tapping anywhere opens file picker.
                This works in Android WebView because <label htmlFor> is native browser behavior,
                not a programmatic .click() which WebViews block. */}
            {activeTab === 'file' && (
              <>
                <input
                  id="examforge-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".json,.csv,.txt,.text,.examforge,application/json,text/csv,text/plain"
                  style={{position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)'}}
                />
                <label
                  htmlFor="examforge-file-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #475569',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#0f172a',
                    minHeight: '180px',
                    margin: 0
                  }}
                >
                  <UploadCloud style={{width: '48px', height: '48px', color: '#22d3ee', marginBottom: '12px'}} />
                  <p style={{fontSize: '15px', fontWeight: 600, color: 'white', margin: '0 0 6px'}}>Tap to select file</p>
                  <p style={{fontSize: '13px', color: '#94a3b8', margin: '0 0 16px'}}>JSON, .examforge, CSV, or TXT</p>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center'}}>
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#67e8f9', background: '#164e63', border: '1px solid #155e75'}}>
                      <FileText style={{width: '12px', height: '12px'}} /> JSON
                    </span>
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#c4b5fd', background: '#4c1d95', border: '1px solid #6d28d9'}}>
                      <FileType style={{width: '12px', height: '12px'}} /> .examforge
                    </span>
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#86efac', background: '#14532d', border: '1px solid #166534'}}>
                      <FileSpreadsheet style={{width: '12px', height: '12px'}} /> CSV
                    </span>
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#fbbf24', background: '#713f12', border: '1px solid #854d0e'}}>
                      <FileType style={{width: '12px', height: '12px'}} /> TXT
                    </span>
                  </div>
                </label>
              </>
            )}

            {/* Paste */}
            {activeTab === 'paste' && (
              <div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '13px', color: '#94a3b8'}}>Paste content or JSON:</span>
                  {jsonText && (
                    <button onClick={() => {setJsonText(''); setParsedPackage(null); setValidationErrors([]);}} style={{color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline'}}>Clear</button>
                  )}
                </div>
                <textarea
                  value={jsonText}
                  onChange={handlePasteChange}
                  placeholder={'Paste JSON, CSV, or text questions here...\n\nJSON: {"formatIdentifier": "EXAMFORGE_PACKAGE", ...}\nCSV: question,answer,option1,option2\nTXT: One question per line'}
                  rows={12}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    minHeight: '200px'
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
                  <span>Issues ({validationErrors.length})</span>
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
        flexShrink: 0,
        position: 'sticky',
        bottom: 0
      }}>
        <button
          onClick={() => navigate('/')}
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
  );
};
