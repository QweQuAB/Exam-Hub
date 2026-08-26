export interface ExamForgeMCQ {
  id: string;
  questionType: 'mcq';
  topic: string | null;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  reference: string | null;
  repeatNote: string | null;
  position: number;
}

export interface ExamForgeEssay {
  id: string;
  questionType: 'essay';
  topic: string | null;
  prompt: string;
  options: string[];
  correctIndex: null;
  explanation: string | null;
  reference: string | null;
  repeatNote: string | null;
  position: number;
}

export interface ExamForgePackage {
  formatIdentifier: 'EXAMFORGE_PACKAGE';
  schemaVersion: number;
  packageId: string;
  title: string;
  courseCode: string | null;
  institution: string | null;
  description: string | null;
  category: string;
  author: string;
  authorRole: string;
  tags: string[];
  exportedAt: number;
  mcqQuestions: ExamForgeMCQ[];
  essayQuestions: ExamForgeEssay[];
}

export interface ForumPackageDocument extends ExamForgePackage {
  id: string; // Firestore doc ID
  likeCount: number;
  downloadCount: number;
  postedByUsername: string;
  postedAt: number;
}

export type SortOption = 'newest' | 'most_liked' | 'most_downloaded' | 'most_questions' | 'title_asc';

export interface FilterState {
  searchQuery: string;
  category: string;
  selectedTag: string;
  sortBy: SortOption;
  typeFilter: 'all' | 'has_mcq' | 'has_essay';
}

export type ReportReason =
  | 'inappropriate'
  | 'broken_link'
  | 'incorrect_answers'
  | 'spam'
  | 'other';

export interface PackageReport {
  id: string; // Firestore doc ID
  packageId: string;
  packageTitle: string;
  author: string;
  category: string;
  reason: ReportReason;
  reasonLabel: string;
  details?: string;
  reportedBy: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface PackageComment {
  id: string; // Firestore doc ID
  packageId: string;
  username: string;
  content: string;
  createdAt: number;
  likeCount?: number;
}

