// ============================================================
// VedaAI Backend - AI Generation Service
// Providers tried in order: OpenAI → Groq → Gemini
// ============================================================
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { IAssignment } from '../models/Assignment';
import { IGeneratedPaperData, ISection, IQuestion, QuestionType, Difficulty } from '../types';

// ── Prompt Builder ──────────────────────────────────────────
const buildPrompt = (assignment: IAssignment): string => {
  const questionTypeLabels: Record<QuestionType, string> = {
    mcq:          'Multiple Choice Questions — provide 4 options (A/B/C/D) and mark the correct answer',
    short_answer: 'Short Answer Questions — 2-4 sentence answers',
    long_answer:  'Long Answer / Essay Questions — detailed paragraph answers',
    true_false:   'True/False Questions — answer is "True" or "False"',
    diagram:      'Diagram/Graph-Based Questions — describe what to draw or interpret',
    numerical:    'Numerical Problems — show full working/calculation steps',
    fill_blanks:  'Fill in the Blanks — one or two word answers',
  };

  const selectedTypes = assignment.questionTypes
    .map(t => `- ${questionTypeLabels[t as QuestionType] ?? t}`)
    .join('\n');

  const { easy, medium, hard } = assignment.difficultyDistribution;

  return `You are an expert academic assessment creator. Generate a complete question paper as valid JSON only.

ASSIGNMENT DETAILS:
- Title: ${assignment.title}
- Subject: ${assignment.subject}  
- Topic: ${assignment.topic}
- Total Questions: ${assignment.numberOfQuestions}
- Total Marks: ${assignment.totalMarks}
- Difficulty: Easy ${easy}%, Medium ${medium}%, Hard ${hard}%

QUESTION TYPES TO INCLUDE:
${selectedTypes}

ADDITIONAL INSTRUCTIONS: ${assignment.instructions || 'None'}

${assignment.uploadedContent ? `REFERENCE MATERIAL:\n${assignment.uploadedContent.slice(0, 2000)}` : ''}

RULES:
1. Group questions into sections by type (Section A, Section B, etc.)
2. Each section must have title and instruction
3. Distribute marks proportionally across questions
4. For MCQ include "options" array with exactly 4 choices and set "answer" field
5. All questions must be relevant to the topic: ${assignment.topic}

RESPOND WITH ONLY THIS JSON STRUCTURE (no markdown, no code fences, no extra text):
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries 2 marks.",
      "questions": [
        {
          "question": "Question text here",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 2,
          "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
          "answer": "A. Option 1"
        }
      ]
    }
  ]
}`;
};

// ── Response Parser ─────────────────────────────────────────
const parseResponse = (raw: string): IGeneratedPaperData => {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); }
      catch { throw new Error(`Invalid JSON in AI response`); }
    } else {
      throw new Error(`No JSON found in AI response`);
    }
  }

  const data = parsed as { sections?: unknown[] };
  if (!data.sections || !Array.isArray(data.sections)) {
    throw new Error('AI response missing "sections" array');
  }

  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const validTypes: QuestionType[]      = ['mcq', 'short_answer', 'long_answer', 'true_false', 'diagram', 'numerical', 'fill_blanks'];

  const sections: ISection[] = data.sections.map((sec: unknown, si: number) => {
    const s = sec as Record<string, unknown>;
    if (!s.title || !s.instruction || !Array.isArray(s.questions)) {
      throw new Error(`Section ${si + 1} is malformed`);
    }

    const questions: IQuestion[] = (s.questions as unknown[]).map((q: unknown, qi: number) => {
      const question = q as Record<string, unknown>;
      if (!question.question) throw new Error(`Question ${qi + 1} in section ${si + 1} missing text`);

      return {
        question:   String(question.question),
        type:       validTypes.includes(question.type as QuestionType) ? (question.type as QuestionType) : 'short_answer',
        difficulty: validDifficulties.includes(question.difficulty as Difficulty) ? (question.difficulty as Difficulty) : 'medium',
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

// ── Provider: OpenAI ────────────────────────────────────────
const tryOpenAI = async (prompt: string): Promise<string> => {
  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const res = await client.chat.completions.create({
    model:           config.openai.model,
    messages:        [{ role: 'user', content: prompt }],
    temperature:     0.7,
    max_tokens:      4000,
    response_format: { type: 'json_object' },
  });
  const text = res.choices[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from OpenAI');
  return text;
};

// ── Provider: Groq (free) ───────────────────────────────────
const tryGroq = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groq = new Groq({ apiKey });
  const res  = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    messages:    [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens:  4000,
  });
  const text = res.choices[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from Groq');
  return text;
};

// ── Provider: Gemini ────────────────────────────────────────
const tryGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const res   = await model.generateContent(prompt);
  const text  = res.response.text();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

// ── Main Export ─────────────────────────────────────────────
export const generateQuestionPaper = async (
  assignment: IAssignment,
  onProgress?: (progress: number, message: string) => void
): Promise<IGeneratedPaperData> => {
  logger.info(`Starting AI generation for assignment: ${assignment._id}`);
  onProgress?.(10, 'Building prompt...');

  const prompt = buildPrompt(assignment);
  const errors: string[] = [];
  let rawResponse: string | null = null;

  // 1. Try OpenAI
  const hasOpenAI = config.openai.apiKey &&
    !config.openai.apiKey.includes('REPLACE_WITH_YOUR_KEY');

  if (hasOpenAI) {
    try {
      onProgress?.(20, 'Generating with OpenAI...');
      rawResponse = await tryOpenAI(prompt);
      logger.info('✅ OpenAI generation successful');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`OpenAI failed: ${msg}`);
      errors.push(`OpenAI: ${msg}`);
    }
  }

  // 2. Try Groq (free, fast)
  if (!rawResponse && process.env.GROQ_API_KEY) {
    try {
      onProgress?.(20, 'Generating with Groq AI...');
      rawResponse = await tryGroq(prompt);
      logger.info('✅ Groq generation successful');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Groq failed: ${msg}`);
      errors.push(`Groq: ${msg}`);
    }
  }

  // 3. Try Gemini
  if (!rawResponse && process.env.GEMINI_API_KEY) {
    try {
      onProgress?.(20, 'Generating with Gemini AI...');
      rawResponse = await tryGemini(prompt);
      logger.info('✅ Gemini generation successful');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Gemini failed: ${msg}`);
      errors.push(`Gemini: ${msg}`);
    }
  }

  if (!rawResponse) {
    throw new Error(
      `All AI providers failed. Errors: ${errors.join(' | ')}. ` +
      'Please add a valid GROQ_API_KEY from https://console.groq.com/keys'
    );
  }

  onProgress?.(70, 'Parsing and validating response...');
  const paperData = parseResponse(rawResponse);

  onProgress?.(90, 'Finalizing question paper...');
  logger.info(`Generation complete: ${paperData.sections.length} sections, ${paperData.sections.reduce((s, sec) => s + sec.questions.length, 0)} questions`);

  return paperData;
};
