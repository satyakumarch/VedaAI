// ============================================================
// VedaAI Backend - AI Generation Service
// Optimized for ~10-15 second generation time
// ============================================================
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { IAssignment } from '../models/Assignment';
import { IGeneratedPaperData, ISection, IQuestion, QuestionType, Difficulty } from '../types';

// ── Compact Prompt — short & precise for fast generation ────
const buildPrompt = (assignment: IAssignment): string => {
  const typeMap: Record<string, string> = {
    mcq:          'MCQ (4 options A/B/C/D, include "answer")',
    short_answer: 'Short Answer',
    long_answer:  'Long Answer',
    true_false:   'True/False (answer: True or False)',
    diagram:      'Diagram-based',
    numerical:    'Numerical (show formula/steps)',
    fill_blanks:  'Fill in the Blanks',
  };

  const types = assignment.questionTypes.map(t => typeMap[t] ?? t).join(', ');
  const { easy, medium, hard } = assignment.difficultyDistribution;

  // Keep instructions short — trim to 200 chars max
  const instr = (assignment.instructions ?? '').slice(0, 200);

  return `Generate a question paper as JSON only. No markdown, no explanation.

Subject: ${assignment.subject} | Topic: ${assignment.topic}
Questions: ${assignment.numberOfQuestions} | Marks: ${assignment.totalMarks}
Difficulty: Easy ${easy}% Medium ${medium}% Hard ${hard}%
Types: ${types}
${instr ? `Note: ${instr}` : ''}

Group by type into sections (Section A, B…). Each section needs title+instruction.
For MCQ add options:["A.x","B.x","C.x","D.x"] and answer field.
Keep questions concise and relevant to: ${assignment.topic}

JSON format:
{"sections":[{"title":"Section A","instruction":"Attempt all. 2 marks each.","questions":[{"question":"...","type":"mcq","difficulty":"easy","marks":2,"options":["A.x","B.x","C.x","D.x"],"answer":"A.x"}]}]}`;
};

// ── Response Parser ─────────────────────────────────────────
const parseResponse = (raw: string): IGeneratedPaperData => {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); }
      catch { throw new Error('Invalid JSON from AI'); }
    } else {
      throw new Error('No JSON in AI response');
    }
  }

  const data = parsed as { sections?: unknown[] };
  if (!data.sections || !Array.isArray(data.sections)) {
    throw new Error('Missing sections array');
  }

  const validDiff: Difficulty[]   = ['easy', 'medium', 'hard'];
  const validTypes: QuestionType[] = ['mcq', 'short_answer', 'long_answer', 'true_false', 'diagram', 'numerical', 'fill_blanks'];

  const sections: ISection[] = data.sections.map((sec: unknown, si: number) => {
    const s = sec as Record<string, unknown>;
    if (!s.title || !s.instruction || !Array.isArray(s.questions)) {
      throw new Error(`Section ${si + 1} malformed`);
    }
    const questions: IQuestion[] = (s.questions as unknown[]).map((q: unknown) => {
      const question = q as Record<string, unknown>;
      return {
        question:   String(question.question ?? ''),
        type:       validTypes.includes(question.type as QuestionType) ? (question.type as QuestionType) : 'short_answer',
        difficulty: validDiff.includes(question.difficulty as Difficulty) ? (question.difficulty as Difficulty) : 'medium',
        marks:      Number(question.marks) || 1,
        options:    Array.isArray(question.options) ? (question.options as string[]) : undefined,
        answer:     question.answer ? String(question.answer) : undefined,
      };
    });
    return {
      title:       String(s.title),
      instruction: String(s.instruction),
      questions,
      totalMarks:  questions.reduce((sum, q) => sum + q.marks, 0),
    };
  });

  return { sections };
};

// ── Provider: Groq — FAST model first ───────────────────────
const tryGroq = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groq = new Groq({ apiKey });

  // Try fastest model first, fall back to larger if needed
  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];

  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens:  3000,  // enough for 25 questions
      });
      const text = res.choices[0]?.message?.content ?? '';
      if (text) {
        logger.info(`✅ Groq (${model}) succeeded`);
        return text;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Groq model ${model} failed: ${msg}`);
    }
  }
  throw new Error('All Groq models failed');
};

// ── Provider: OpenAI ────────────────────────────────────────
const tryOpenAI = async (prompt: string): Promise<string> => {
  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const res = await client.chat.completions.create({
    model:           'gpt-4o-mini',
    messages:        [{ role: 'user', content: prompt }],
    temperature:     0.6,
    max_tokens:      3000,
    response_format: { type: 'json_object' },
  });
  const text = res.choices[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from OpenAI');
  return text;
};

// ── Provider: Gemini ────────────────────────────────────────
const tryGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.6, maxOutputTokens: 3000 },
  });
  const res  = await model.generateContent(prompt);
  const text = res.response.text();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

// ── Main Export ─────────────────────────────────────────────
export const generateQuestionPaper = async (
  assignment: IAssignment,
  onProgress?: (progress: number, message: string) => void
): Promise<IGeneratedPaperData> => {
  const start = Date.now();
  logger.info(`AI generation started: ${assignment._id}`);
  onProgress?.(10, 'Building prompt...');

  const prompt = buildPrompt(assignment);
  const errors: string[] = [];
  let raw: string | null = null;

  // Priority order: Groq (fastest, free) → OpenAI → Gemini
  const hasOpenAI = config.openai.apiKey &&
    !config.openai.apiKey.includes('REPLACE_WITH_YOUR_KEY');

  // 1. Groq first (fastest)
  if (process.env.GROQ_API_KEY) {
    try {
      onProgress?.(20, 'Generating with Groq AI (fast)...');
      raw = await tryGroq(prompt);
    } catch (err: unknown) {
      errors.push(`Groq: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 2. OpenAI fallback
  if (!raw && hasOpenAI) {
    try {
      onProgress?.(20, 'Generating with OpenAI...');
      raw = await tryOpenAI(prompt);
    } catch (err: unknown) {
      errors.push(`OpenAI: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 3. Gemini fallback
  if (!raw && process.env.GEMINI_API_KEY) {
    try {
      onProgress?.(20, 'Generating with Gemini...');
      raw = await tryGemini(prompt);
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!raw) {
    throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
  }

  onProgress?.(75, 'Parsing response...');
  const paperData = parseResponse(raw);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  onProgress?.(95, `Done in ${elapsed}s`);
  logger.info(`✅ Generation complete in ${elapsed}s — ${paperData.sections.length} sections`);

  return paperData;
};
