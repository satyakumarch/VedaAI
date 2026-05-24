// ============================================================
// VedaAI Backend - Zod Validation Schemas
// ============================================================
import { z } from 'zod';

// All valid question types (extended to match frontend)
export const QUESTION_TYPES = [
  'mcq',
  'short_answer',
  'long_answer',
  'true_false',
  'diagram',
  'numerical',
  'fill_blanks',
] as const;

export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

// Coerce string → number for FormData fields
const coerceInt = z.coerce.number().int();
const coerceFloat = z.coerce.number();

export const difficultyDistributionSchema = z
  .object({
    easy:   coerceFloat.min(0).max(100),
    medium: coerceFloat.min(0).max(100),
    hard:   coerceFloat.min(0).max(100),
  })
  .refine((d) => Math.round(d.easy + d.medium + d.hard) === 100, {
    message: 'Difficulty distribution must sum to 100',
  });

export const createAssignmentSchema = z.object({
  title:   z.string().min(3, 'Title must be at least 3 characters').max(200),
  subject: z.string().min(2, 'Subject is required').max(100),
  topic:   z.string().min(2, 'Topic is required').max(200),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid due date'),

  // Accept JSON string OR array (FormData sends JSON string)
  questionTypes: z
    .union([
      z.array(z.enum(QUESTION_TYPES)),
      z.string().transform((s) => {
        try { return JSON.parse(s) as string[]; }
        catch { return [s]; }
      }),
    ])
    .pipe(z.array(z.enum(QUESTION_TYPES)).min(1, 'Select at least one question type')),

  numberOfQuestions: coerceInt.min(1).max(500),
  totalMarks:        coerceInt.min(1).max(2000),

  // Accept JSON string OR object
  difficultyDistribution: z
    .union([
      difficultyDistributionSchema,
      z.string().transform((s) => {
        try { return JSON.parse(s); }
        catch { return { easy: 40, medium: 40, hard: 20 }; }
      }),
    ])
    .pipe(difficultyDistributionSchema),

  instructions: z.string().max(2000).optional(),
});

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type RegisterInput  = z.infer<typeof registerSchema>;
export type LoginInput     = z.infer<typeof loginSchema>;
