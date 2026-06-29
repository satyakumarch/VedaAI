// ============================================================
// VedaAI Backend - AI Generation Service (Optimized for speed)
// ============================================================
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { IAssignment } from '../models/Assignment';
import { IGeneratedPaperData, ISection, IQuestion, QuestionType, Difficulty } from '../types';

// ── Minimal prompt for maximum speed ────────────────────────
const buildPrompt = (assignment: IAssignment): string => {
  const typeMap: Record<string, string> = {
    mcq:          'MCQ(4opts,answer)',
    short_answer: 'ShortAnswer',
    long_answer:  'LongAnswer',
    true_false:   'TrueFalse(answer:True/False)',
    diagram:      'DiagramBased',
    numerical:    'Numerical',
    fill_blanks:  'FillBlanks',
  };

  const types  = assignment.questionTypes.map(t => typeMap[t] ?? t).join(',');
  const { easy, medium, hard } = assignment.difficultyDistribution;
  const instr  = (assignment.instructions ?? '').slice(0, 150);
  const nq     = assignment.numberOfQuestions;
  const marks  = assignment.totalMarks;
  const mPerQ  = Math.round(marks / nq);

  return `Output ONLY valid JSON. No text before or after.
Create exam: subject=${assignment.subject}, topic=${assignment.topic}, questions=${nq}, totalMarks=${marks}, marksEach=${mPerQ}
Difficulty: easy=${easy}% medium=${medium}% hard=${hard}%
Types: ${types}
${instr ? `Note: ${instr}` : ''}
Group by type in sections. MCQ must have options:["A.x","B.x","C.x","D.x"] and answer.
{"sections":[{"title":"Section A","instruction":"Attempt all.","questions":[{"question":"?","type":"mcq","difficulty":"easy","marks":${mPerQ},"options":["A.x","B.x","C.x","D.x"],"answer":"A.x"}]}]}`;
};

// ── Response Parser ─────────────────────────────────────────
const parseResponse = (raw: string): IGeneratedPaperData => {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); }
  catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { throw new Error('Bad JSON'); } }
    else throw new Error('No JSON in response');
  }

  const data = parsed as { sections?: unknown[] };
  if (!Array.isArray(data.sections)) throw new Error('Missing sections');

  const vd: Difficulty[]   = ['easy','medium','hard'];
  const vt: QuestionType[] = ['mcq','short_answer','long_answer','true_false','diagram','numerical','fill_blanks'];

  const sections: ISection[] = data.sections.map((sec: unknown, si) => {
    const s = sec as Record<string, unknown>;
    if (!s.title || !s.instruction || !Array.isArray(s.questions))
      throw new Error(`Section ${si+1} malformed`);
    const questions: IQuestion[] = (s.questions as unknown[]).map((q: unknown) => {
      const r = q as Record<string, unknown>;
      return {
        question:   String(r.question ?? ''),
        type:       vt.includes(r.type as QuestionType) ? r.type as QuestionType : 'short_answer',
        difficulty: vd.includes(r.difficulty as Difficulty) ? r.difficulty as Difficulty : 'medium',
        marks:      Number(r.marks) || 1,
        options:    Array.isArray(r.options) ? r.options as string[] : undefined,
        answer:     r.answer ? String(r.answer) : undefined,
      };
    });
    return {
      title:      String(s.title),
      instruction:String(s.instruction),
      questions,
      totalMarks: questions.reduce((s,q) => s+q.marks, 0),
    };
  });
  return { sections };
};

// ── Groq (fastest) ──────────────────────────────────────────
const tryGroq = async (prompt: string): Promise<string> => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No GROQ_API_KEY');
  const groq = new Groq({ apiKey: key });
  // Try instant model first, then versatile
  for (const model of ['llama-3.1-8b-instant','llama-3.3-70b-versatile']) {
    try {
      const res = await groq.chat.completions.create({
        model, temperature: 0.5, max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      });
      const t = res.choices[0]?.message?.content ?? '';
      if (t) { logger.info(`Groq (${model}) OK`); return t; }
    } catch (e: unknown) {
      logger.warn(`Groq ${model}: ${e instanceof Error ? e.message : e}`);
    }
  }
  throw new Error('Groq failed');
};

// ── OpenAI fallback ─────────────────────────────────────────
const tryOpenAI = async (prompt: string): Promise<string> => {
  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 2500,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });
  const t = res.choices[0]?.message?.content ?? '';
  if (!t) throw new Error('Empty OpenAI response');
  return t;
};

// ── Gemini fallback ─────────────────────────────────────────
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

// ── Main Export ─────────────────────────────────────────────
export const generateQuestionPaper = async (
  assignment: IAssignment,
  onProgress?: (pct: number, msg: string) => void
): Promise<IGeneratedPaperData> => {
  const start = Date.now();
  logger.info(`Generation start: ${assignment._id}`);

  const prompt = buildPrompt(assignment);

  // Smooth progress ticker — increments every 600ms during AI call
  let pct = 15;
  const ticker = setInterval(() => {
    if (pct < 85) {
      pct = Math.min(85, pct + (Math.random() * 6 + 3)); // +3~9% per tick
      onProgress?.(Math.round(pct), 'AI generating questions...');
    }
  }, 600);

  onProgress?.(10, 'Sending to AI...');

  const errors: string[] = [];
  let raw: string | null = null;

  // 1. Groq (fastest, free)
  if (process.env.GROQ_API_KEY) {
    try { raw = await tryGroq(prompt); }
    catch (e: unknown) { errors.push(`Groq: ${e instanceof Error ? e.message : e}`); }
  }

  // 2. OpenAI
  if (!raw && config.openai.apiKey && !config.openai.apiKey.includes('REPLACE')) {
    try { raw = await tryOpenAI(prompt); }
    catch (e: unknown) { errors.push(`OpenAI: ${e instanceof Error ? e.message : e}`); }
  }

  // 3. Gemini
  if (!raw && process.env.GEMINI_API_KEY) {
    try { raw = await tryGemini(prompt); }
    catch (e: unknown) { errors.push(`Gemini: ${e instanceof Error ? e.message : e}`); }
  }

  clearInterval(ticker);

  if (!raw) throw new Error(`All providers failed: ${errors.join(' | ')}`);

  onProgress?.(88, 'Parsing paper...');
  const data = parseResponse(raw);

  onProgress?.(95, 'Finalizing...');
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  logger.info(`✅ Done in ${elapsed}s — ${data.sections.length} sections`);

  return data;
};
