// ============================================================
// VedaAI Frontend - Shared Types
// ============================================================

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'diagram' | 'numerical' | 'fill_blanks';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AssignmentStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  totalMarks: number;
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  file?: File | null;
}

export interface Question {
  _id?: string;
  question: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface Section {
  _id?: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface Assignment {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  totalMarks: number;
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  uploadedFileName?: string;
  status: AssignmentStatus;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string | Assignment;
  userId: string;
  sections: Section[];
  totalMarks: number;
  totalQuestions: number;
  difficultyBreakdown: DifficultyDistribution;
  generatedAt: string;
  regenerationCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket event payloads
export interface GenerationProgressPayload {
  assignmentId: string;
  status: AssignmentStatus;
  progress: number;
  message: string;
  data?: {
    sections: Section[];
  };
}

export type GenerationEvent =
  | 'generation_started'
  | 'generation_progress'
  | 'generation_completed'
  | 'generation_failed';
