// ============================================================
// VedaAI Backend - Shared Types
// ============================================================

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'diagram' | 'numerical' | 'fill_blanks';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AssignmentStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
export type GenerationEvent =
  | 'generation_started'
  | 'generation_progress'
  | 'generation_completed'
  | 'generation_failed';

export interface DifficultyDistribution {
  easy: number;   // percentage
  medium: number;
  hard: number;
}

export interface IQuestion {
  question: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];       // for MCQ
  answer?: string;          // optional model answer
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IGeneratedPaperData {
  sections: ISection[];
}

export interface JobProgressPayload {
  assignmentId: string;
  status: AssignmentStatus;
  progress: number;         // 0-100
  message: string;
  data?: IGeneratedPaperData;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
}
