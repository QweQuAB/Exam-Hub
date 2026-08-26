import { ExamForgePackage, ForumPackageDocument } from '../types';

export interface ValidationResult {
  valid: boolean;
  package?: ExamForgePackage;
  errors: string[];
}

export function validateExamForgePackage(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Input is not a valid JSON object.'] };
  }

  // formatIdentifier check
  if (data.formatIdentifier !== 'EXAMFORGE_PACKAGE') {
    errors.push(
      `Invalid formatIdentifier: expected 'EXAMFORGE_PACKAGE', found '${data.formatIdentifier || 'undefined'}'.`
    );
  }

  // schemaVersion check
  if (typeof data.schemaVersion !== 'number') {
    errors.push('Missing or invalid schemaVersion (must be a number, typically 1).');
  }

  // title check
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Missing or empty title (required string).');
  }

  // author check
  if (typeof data.author !== 'string' || data.author.trim().length === 0) {
    errors.push('Missing or empty author (required string).');
  }

  // authorRole check
  if (typeof data.authorRole !== 'string') {
    errors.push('Missing or invalid authorRole (must be a string).');
  }

  // mcqQuestions array check
  if (!Array.isArray(data.mcqQuestions)) {
    errors.push('Missing or invalid mcqQuestions (must be an array).');
  } else {
    data.mcqQuestions.forEach((mcq: any, idx: number) => {
      if (!mcq || typeof mcq !== 'object') {
        errors.push(`MCQ #${idx + 1} is not a valid object.`);
        return;
      }
      if (mcq.questionType !== 'mcq') {
        errors.push(`MCQ #${idx + 1} has invalid questionType (must be 'mcq').`);
      }
      if (!mcq.prompt || typeof mcq.prompt !== 'string') {
        errors.push(`MCQ #${idx + 1} has missing or invalid prompt.`);
      }
      if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
        errors.push(`MCQ #${idx + 1} must have an options array with at least 2 choices.`);
      } else {
        if (
          typeof mcq.correctIndex !== 'number' ||
          mcq.correctIndex < 0 ||
          mcq.correctIndex >= mcq.options.length
        ) {
          errors.push(
            `MCQ #${idx + 1} correctIndex (${mcq.correctIndex}) is out of bounds for ${mcq.options.length} options.`
          );
        }
      }
    });
  }

  // essayQuestions array check
  if (!Array.isArray(data.essayQuestions)) {
    errors.push('Missing or invalid essayQuestions (must be an array).');
  } else {
    data.essayQuestions.forEach((essay: any, idx: number) => {
      if (!essay || typeof essay !== 'object') {
        errors.push(`Essay #${idx + 1} is not a valid object.`);
        return;
      }
      if (essay.questionType !== 'essay') {
        errors.push(`Essay #${idx + 1} has invalid questionType (must be 'essay').`);
      }
      if (!essay.prompt || typeof essay.prompt !== 'string') {
        errors.push(`Essay #${idx + 1} has missing or invalid prompt.`);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build clean normalized ExamForgePackage
  const normalizedPackage: ExamForgePackage = {
    formatIdentifier: 'EXAMFORGE_PACKAGE',
    schemaVersion: Number(data.schemaVersion) || 1,
    packageId: String(data.packageId || crypto.randomUUID()),
    title: String(data.title).trim(),
    courseCode: data.courseCode ? String(data.courseCode).trim() : null,
    institution: data.institution ? String(data.institution).trim() : null,
    description: data.description ? String(data.description).trim() : null,
    category: data.category && String(data.category).trim() ? String(data.category).trim() : 'General',
    author: String(data.author).trim(),
    authorRole: String(data.authorRole).trim() || 'Contributor',
    tags: Array.isArray(data.tags)
      ? data.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : [],
    exportedAt: Number(data.exportedAt) || Date.now(),
    mcqQuestions: data.mcqQuestions.map((q: any, i: number) => ({
      id: String(q.id || crypto.randomUUID()),
      questionType: 'mcq',
      topic: q.topic ? String(q.topic) : null,
      prompt: String(q.prompt),
      options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [],
      correctIndex: Number(q.correctIndex) || 0,
      explanation: q.explanation ? String(q.explanation) : null,
      reference: q.reference ? String(q.reference) : null,
      repeatNote: q.repeatNote ? String(q.repeatNote) : null,
      position: typeof q.position === 'number' ? q.position : i,
    })),
    essayQuestions: data.essayQuestions.map((q: any, i: number) => ({
      id: String(q.id || crypto.randomUUID()),
      questionType: 'essay',
      topic: q.topic ? String(q.topic) : null,
      prompt: String(q.prompt),
      options: [],
      correctIndex: null,
      explanation: q.explanation ? String(q.explanation) : null,
      reference: q.reference ? String(q.reference) : null,
      repeatNote: q.repeatNote ? String(q.repeatNote) : null,
      position: typeof q.position === 'number' ? q.position : i,
    })),
  };

  return { valid: true, package: normalizedPackage, errors: [] };
}

/**
 * Strips all forum-specific metadata and returns the exact byte-for-byte compatible JSON object
 */
export function cleanPackageForExport(pkg: ForumPackageDocument | ExamForgePackage): ExamForgePackage {
  return {
    formatIdentifier: 'EXAMFORGE_PACKAGE',
    schemaVersion: pkg.schemaVersion || 1,
    packageId: pkg.packageId,
    title: pkg.title,
    courseCode: pkg.courseCode ?? null,
    institution: pkg.institution ?? null,
    description: pkg.description ?? null,
    category: pkg.category || 'General',
    author: pkg.author,
    authorRole: pkg.authorRole,
    tags: pkg.tags || [],
    exportedAt: pkg.exportedAt || Date.now(),
    mcqQuestions: (pkg.mcqQuestions || []).map((q, idx) => ({
      id: q.id || crypto.randomUUID(),
      questionType: 'mcq',
      topic: q.topic ?? null,
      prompt: q.prompt,
      options: q.options || [],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation ?? null,
      reference: q.reference ?? null,
      repeatNote: q.repeatNote ?? null,
      position: typeof q.position === 'number' ? q.position : idx,
    })),
    essayQuestions: (pkg.essayQuestions || []).map((q, idx) => ({
      id: q.id || crypto.randomUUID(),
      questionType: 'essay',
      topic: q.topic ?? null,
      prompt: q.prompt,
      options: [],
      correctIndex: null,
      explanation: q.explanation ?? null,
      reference: q.reference ?? null,
      repeatNote: q.repeatNote ?? null,
      position: typeof q.position === 'number' ? q.position : idx,
    })),
  };
}

export function downloadPackageAsJsonFile(pkg: ForumPackageDocument | ExamForgePackage) {
  const cleanData = cleanPackageForExport(pkg);
  const jsonString = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Safe filename
  const sanitizedTitle = (pkg.courseCode ? `${pkg.courseCode}_` : '') +
    (pkg.title || 'exam_package')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, '_')
      .substring(0, 40);
      
  link.href = url;
  link.download = `${sanitizedTitle}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
