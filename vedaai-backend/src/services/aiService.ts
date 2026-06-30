// ============================================================
// VedaAI Backend - AI Generation Service
// Multi-provider with rate limit fallback
// ============================================================
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { IAssignment } from '../models/Assignment';
import { IGeneratedPaperData, ISection, IQuestion, QuestionType, Difficulty } from '../types';

// ── Compact Prompt ───────────────────────────────────────────
const buildPrompt = (assignment: IAssignment): string => {
  const typeMap: Record<string, string> = {
    mcq:          'MCQ(4opts,answer)',
    short_answer: 'ShortAnswer',
    long_answer:  'LongAnswer',
    true_false:   'TrueFalse(True/False)',
    diagram:      'DiagramBased',
    numerical:    'Numerical',
    fill_blanks:  'FillBlanks',
  };
  const types  = assignment.questionTypes.map(t => typeMap[t] ?? t).join(',');
  const { easy, medium, hard } = assignment.difficultyDistribution;
  const instr  = (assignment.instructions ?? '').slice(0, 200);
  const nq     = assignment.numberOfQuestions;
  const marks  = assignment.totalMarks;
  const mPerQ  = Math.max(1, Math.round(marks / nq));

  return `Return ONLY valid JSON, no markdown, no explanation.
Exam: subject="${assignment.subject}" topic="${assignment.topic}" questions=${nq} totalMarks=${marks} marksEach=${mPerQ}
Difficulty: easy=${easy}% medium=${medium}% hard=${hard}%
Types: ${types}
${instr ? `Instructions: ${instr}` : ''}
Group by type in sections. For MCQ include options:["A.x","B.x","C.x","D.x"] and answer field.
JSON: {"sections":[{"title":"Section A","instruction":"Attempt all.","questions":[{"question":"...","type":"mcq","difficulty":"easy","marks":${mPerQ},"options":["A.x","B.x","C.x","D.x"],"answer":"A.x"}]}]}`;
};

// ── Response Parser ──────────────────────────────────────────
const parseResponse = (raw: string): IGeneratedPaperData => {
  const cleaned = raw.replace(/```json\s*/gi,'').replace(/```\s*/gi,'').trim();
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); }
  catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { throw new Error('Bad JSON from AI'); } }
    else throw new Error('No JSON in AI response');
  }

  const data = parsed as { sections?: unknown[] };
  if (!Array.isArray(data.sections)) throw new Error('Missing sections array');

  const vd: Difficulty[]    = ['easy','medium','hard'];
  const vt: QuestionType[]  = ['mcq','short_answer','long_answer','true_false','diagram','numerical','fill_blanks'];

  const sections: ISection[] = data.sections.map((sec: unknown, si) => {
    const s = sec as Record<string, unknown>;
    if (!s.title || !s.instruction || !Array.isArray(s.questions))
      throw new Error(`Section ${si+1} malformed`);
    const questions: IQuestion[] = (s.questions as unknown[]).map((q: unknown) => {
      const r = q as Record<string, unknown>;
      return {
        question:   String(r.question ?? 'Question'),
        type:       vt.includes(r.type as QuestionType) ? r.type as QuestionType : 'short_answer',
        difficulty: vd.includes(r.difficulty as Difficulty) ? r.difficulty as Difficulty : 'medium',
        marks:      Number(r.marks) || 1,
        options:    Array.isArray(r.options) ? r.options as string[] : undefined,
        answer:     r.answer ? String(r.answer) : undefined,
      };
    });
    return {
      title:       String(s.title),
      instruction: String(s.instruction),
      questions,
      totalMarks:  questions.reduce((acc, q) => acc + q.marks, 0),
    };
  });
  return { sections };
};

// ── Groq — tries all available models ───────────────────────
const tryGroq = async (prompt: string): Promise<string> => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No GROQ_API_KEY');

  const groq   = new Groq({ apiKey: key });
  // All available free Groq models — tries each until one works
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
  ];

  const errors: string[] = [];
  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model, temperature: 0.5, max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      });
      const t = res.choices[0]?.message?.content ?? '';
      if (t) { logger.info(`✅ Groq/${model} success`); return t; }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn(`Groq/${model} failed: ${msg}`);
      errors.push(`${model}: ${msg}`);
      // Only skip to next model on rate limit errors
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('too many');
      if (!isRateLimit) break; // non-rate-limit error — stop trying Groq
    }
  }
  throw new Error(`Groq failed: ${errors.join(' | ')}`);
};

// ── OpenAI ──────────────────────────────────────────────────
const tryOpenAI = async (prompt: string): Promise<string> => {
  const key = config.openai.apiKey;
  if (!key || key.includes('REPLACE')) throw new Error('No OpenAI key');
  const client = new OpenAI({ apiKey: key });
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 2500,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });
  const t = res.choices[0]?.message?.content ?? '';
  if (!t) throw new Error('Empty OpenAI response');
  return t;
};

// ── Gemini ──────────────────────────────────────────────────
const tryGemini = async (prompt: string): Promise<string> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No GEMINI_API_KEY');
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.5, maxOutputTokens: 2500 },
  });
  const res = await model.generateContent(prompt);
  const t   = res.response.text();
  if (!t) throw new Error('Empty Gemini response');
  return t;
};

// ── Main ─────────────────────────────────────────────────────
export const generateQuestionPaper = async (
  assignment: IAssignment,
  onProgress?: (pct: number, msg: string) => void
): Promise<IGeneratedPaperData> => {
  const start = Date.now();
  logger.info(`Generation start: ${assignment._id}`);

  const prompt = buildPrompt(assignment);

  // Smooth progress during AI call — ticks every 600ms
  let pct = 12;
  const ticker = setInterval(() => {
    if (pct < 83) {
      pct = Math.min(83, pct + Math.random() * 7 + 2);
      onProgress?.(Math.round(pct), 'AI generating questions...');
    }
  }, 600);

  onProgress?.(10, 'Sending to AI...');

  const errors: string[] = [];
  let raw: string | null = null;

  // Try providers in order
  if (process.env.GROQ_API_KEY) {
    try { raw = await tryGroq(prompt); }
    catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      logger.warn(`Groq all models failed: ${m}`);
      errors.push(`Groq: ${m}`);
    }
  }

  if (!raw) {
    try { raw = await tryOpenAI(prompt); }
    catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      errors.push(`OpenAI: ${m}`);
    }
  }

  if (!raw && process.env.GEMINI_API_KEY) {
    try { raw = await tryGemini(prompt); }
    catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      errors.push(`Gemini: ${m}`);
    }
  }

  clearInterval(ticker);

  if (!raw) {
    const errMsg = `All AI providers failed: ${errors.join(' | ')}`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  onProgress?.(88, 'Parsing response...');
  const data = parseResponse(raw);

  onProgress?.(95, 'Finalizing paper...');
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  logger.info(`✅ Generation done in ${elapsed}s — ${data.sections.length} sections, ${data.sections.reduce((s,sec)=>s+sec.questions.length,0)} questions`);

  return data;
};
