import { ExamForgePackage } from '../types';

/**
 * Clean starter template skeleton for users creating a new JSON package
 */
export const STARTER_PACKAGE_TEMPLATE: ExamForgePackage = {
  formatIdentifier: 'EXAMFORGE_PACKAGE',
  schemaVersion: 1,
  packageId: 'my-custom-course-pkg',
  title: 'Custom Course Examination Package',
  courseCode: 'COURSE-101',
  institution: 'University / Institute Name',
  description: 'Concise summary of exam topics, modules, and focus areas included in this package.',
  category: 'Computer Science',
  author: 'Instructor or Contributor Name',
  authorRole: 'Author / Lecturer',
  tags: ['Exam', 'Revision', 'Core'],
  exportedAt: Date.now(),
  mcqQuestions: [
    {
      id: 'q-mcq-1',
      questionType: 'mcq',
      topic: 'Topic 1',
      prompt: 'Enter your multiple choice question prompt here...',
      options: [
        'Option A (First choice)',
        'Option B (Second choice)',
        'Option C (Third choice)',
        'Option D (Fourth choice)'
      ],
      correctIndex: 0,
      explanation: 'Detailed explanation of why Option A is the correct answer and why other distractors are incorrect.',
      reference: 'Textbook or Syllabus Reference Chapter 1',
      repeatNote: null,
      position: 0
    }
  ],
  essayQuestions: [
    {
      id: 'q-essay-1',
      questionType: 'essay',
      topic: 'Topic 2',
      prompt: 'Enter your detailed essay / open-ended examination question here...',
      options: [],
      correctIndex: null,
      explanation: 'Comprehensive marking scheme, key points, grading rubric, and expected theoretical arguments.',
      reference: 'Course Lecture Notes Week 4',
      repeatNote: null,
      position: 0
    }
  ]
};
