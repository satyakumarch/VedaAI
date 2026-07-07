// ============================================================
// VedaAI Backend - PDF Generation Service
// Clean exam-paper style — no gaps between questions
// ============================================================
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { IGeneratedPaper } from '../models/GeneratedPaper';
import { IAssignment } from '../models/Assignment';
import { logger } from '../utils/logger';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ML     = 45;   // left margin
const MR     = 45;   // right margin
const MT     = 40;   // top margin
const MB     = 35;   // bottom margin
const CW     = PAGE_W - ML - MR; // content width

const C = {
  navy:   rgb(0.08, 0.18, 0.42),
  white:  rgb(1, 1, 1),
  black:  rgb(0, 0, 0),
  dark:   rgb(0.15, 0.15, 0.15),
  gray:   rgb(0.45, 0.45, 0.45),
  light:  rgb(0.82, 0.82, 0.82),
  easy:   rgb(0.10, 0.60, 0.28),
  medium: rgb(0.75, 0.52, 0.0),
  hard:   rgb(0.78, 0.12, 0.12),
  orange: rgb(0.88, 0.38, 0.08),
};

// Safe text — strip non-latin chars
const safe = (t: unknown): string =>
  String(t ?? '').replace(/[^\x20-\x7E]/g, '?').trim();

// Wrap text to max width
const wrap = (text: string, font: PDFFont, size: number, maxW: number): string[] => {
  const words = safe(text).split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    try {
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line); line = w;
      } else { line = test; }
    } catch { line = test; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

export const generateExamPDF = async (
  paper: IGeneratedPaper,
  assignment: IAssignment
): Promise<Uint8Array> => {
  logger.info(`PDF generation start: ${assignment._id}`);

  const doc     = await PDFDocument.create();
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic  = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y    = PAGE_H - MT;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y    = PAGE_H - MT;
  };

  const check = (need: number) => { if (y - need < MB + 20) newPage(); };

  const txt = (
    t: string, x: number, yPos: number,
    font: PDFFont, size: number,
    color = C.dark
  ) => {
    try { page.drawText(safe(t), { x, y: yPos, size, font, color }); }
    catch { /* skip if fails */ }
  };

  const hline = (yPos: number, x1 = ML, x2 = PAGE_W - MR, thickness = 0.5, color = C.light) => {
    page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness, color });
  };

  const wrapDraw = (
    text: string, x: number, startY: number,
    font: PDFFont, size: number,
    maxW: number, lineH: number,
    color = C.dark
  ): number => {
    const lines = wrap(text, font, size, maxW);
    let cy = startY;
    for (const ln of lines) {
      check(lineH + 2);
      txt(ln, x, cy, font, size, color);
      cy -= lineH;
    }
    return cy;
  };

  // ── Extract class from instructions ──────────────────────
  const classMatch = (assignment.instructions ?? '').match(/Class:\s*([^\n]+)/);
  const className  = classMatch ? classMatch[1].trim() : '';

  // ── HEADER ───────────────────────────────────────────────
  // Top accent bar
  page.drawRectangle({ x: ML, y: y - 3, width: CW, height: 4, color: C.navy });
  y -= 14;

  // Institution line
  txt('VEDAAI ASSESSMENT PLATFORM', ML, y, regular, 7.5, C.gray);
  y -= 16;

  // Title (centered)
  const title = safe(assignment.title).toUpperCase();
  const titleLines = wrap(title, bold, 16, CW);
  for (const ln of titleLines) {
    try {
      const w = bold.widthOfTextAtSize(ln, 16);
      txt(ln, (PAGE_W - w) / 2, y, bold, 16, C.navy);
    } catch { txt(ln, ML, y, bold, 16, C.navy); }
    y -= 21;
  }

  // Subject / Topic / Class row
  const meta = [
    `Subject: ${safe(assignment.subject)}`,
    `Topic: ${safe(assignment.topic)}`,
    className ? `Class: ${className}` : '',
  ].filter(Boolean).join('   |   ');
  try {
    const mw = regular.widthOfTextAtSize(meta, 9.5);
    txt(meta, (PAGE_W - mw) / 2, y, regular, 9.5, C.gray);
  } catch { txt(meta, ML, y, regular, 9.5, C.gray); }
  y -= 16;

  hline(y, ML, PAGE_W - MR, 0.8, C.light);
  y -= 12;

  // Marks / Date row
  const dueStr = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  txt(`Total Marks: ${paper.totalMarks ?? 0}`, ML, y, bold, 9.5);
  txt(`Total Questions: ${paper.totalQuestions ?? 0}`, ML + 130, y, regular, 9.5, C.gray);
  if (dueStr) txt(`Due: ${dueStr}`, PAGE_W - MR - 110, y, regular, 9.5, C.gray);
  y -= 16;

  // Student info box
  const boxH = 52;
  page.drawRectangle({ x: ML, y: y - boxH, width: CW, height: boxH, color: rgb(0.97, 0.97, 0.97) });
  page.drawLine({ start: { x: ML, y: y - boxH }, end: { x: ML + CW, y: y - boxH }, thickness: 0.6, color: C.light });
  page.drawLine({ start: { x: ML, y }, end: { x: ML + CW, y }, thickness: 0.6, color: C.light });
  page.drawLine({ start: { x: ML, y: y - boxH }, end: { x: ML, y }, thickness: 0.6, color: C.light });
  page.drawLine({ start: { x: ML + CW, y: y - boxH }, end: { x: ML + CW, y }, thickness: 0.6, color: C.light });
  txt('Name: ___________________________', ML + 8, y - 14, regular, 8.5);
  txt('Roll No: ________________',         ML + 230, y - 14, regular, 8.5);
  txt('Section: ________________',         ML + 8,   y - 32, regular, 8.5);
  txt('Date: ___________________',          ML + 230, y - 32, regular, 8.5);
  y -= boxH + 10;

  // General instructions (only real ones, not class/breakdown)
  const realInstr = (assignment.instructions ?? '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('Class:') && !l.startsWith('Question breakdown:'))
    .join(' ')
    .slice(0, 200);

  if (realInstr) {
    txt('Instructions: ', ML, y, bold, 8, C.navy);
    y = wrapDraw(realInstr, ML + 70, y, italic, 8, CW - 70, 11, C.gray);
    y -= 4;
  }

  hline(y, ML, PAGE_W - MR, 1.2, C.navy);
  y -= 12;

  // ── SECTIONS ─────────────────────────────────────────────
  let qNum = 1;

  for (const section of paper.sections) {
    check(40);

    // Section header — navy bar
    page.drawRectangle({ x: ML, y: y - 20, width: CW, height: 22, color: C.navy });
    txt(safe(section.title).toUpperCase(), ML + 8, y - 14, bold, 10.5, C.white);
    const marksLbl = `[${section.totalMarks ?? 0} Marks]`;
    try {
      const mw = bold.widthOfTextAtSize(marksLbl, 9);
      txt(marksLbl, PAGE_W - MR - mw - 6, y - 14, bold, 9, C.white);
    } catch { txt(marksLbl, PAGE_W - MR - 55, y - 14, bold, 9, C.white); }
    y -= 26;

    // Section instruction (italic, small)
    if (section.instruction) {
      txt(safe(section.instruction), ML, y, italic, 8, C.gray);
      y -= 12;
    }

    // ── Questions — NO gaps ──────────────────────────────
    for (const q of section.questions) {
      const qText  = safe(q.question);
      const qLines = wrap(qText, regular, 9.5, CW - 72);
      const optH   = q.options?.length ? q.options.length * 12 : 0;
      const needed = qLines.length * 13 + optH + 8;
      check(needed);

      // Question number circle (small)
      page.drawCircle({ x: ML + 8, y: y - 1, size: 7, color: C.navy });
      txt(String(qNum), qNum < 10 ? ML + 5.5 : ML + 3.5, y - 4, bold, 6.5, C.white);

      // Difficulty badge
      const diffColor = q.difficulty === 'easy' ? C.easy : q.difficulty === 'hard' ? C.hard : C.medium;
      const diffLbl   = (q.difficulty ?? 'medium').charAt(0).toUpperCase() + (q.difficulty ?? 'medium').slice(1);
      try {
        const bw = bold.widthOfTextAtSize(diffLbl, 6) + 6;
        page.drawRectangle({ x: PAGE_W - MR - bw - 28, y: y - 8, width: bw, height: 11, color: diffColor });
        txt(diffLbl, PAGE_W - MR - bw - 25, y - 3, bold, 6, C.white);
      } catch { /* skip badge */ }

      // Marks label
      const mLbl = `[${q.marks ?? 1}M]`;
      try {
        const mlw = bold.widthOfTextAtSize(mLbl, 8);
        txt(mLbl, PAGE_W - MR - mlw, y, bold, 8, C.orange);
      } catch { txt(mLbl, PAGE_W - MR - 22, y, bold, 8, C.orange); }

      // Question text
      let qy = y;
      for (const ln of qLines) {
        txt(ln, ML + 20, qy, regular, 9.5);
        qy -= 13;
      }
      y = qy - 1;

      // MCQ options — 2 per row, compact
      if (q.options && q.options.length > 0) {
        const half = Math.ceil(q.options.length / 2);
        for (let i = 0; i < half; i++) {
          const left  = q.options[i];
          const right = q.options[i + half];
          txt(safe(left),  ML + 22, y, regular, 8.5, C.gray);
          if (right) txt(safe(right), ML + 22 + CW / 2, y, regular, 8.5, C.gray);
          y -= 12;
        }
      }

      // Thin separator line between questions (no gap)
      hline(y - 1, ML + 18, PAGE_W - MR, 0.35, rgb(0.88, 0.88, 0.88));
      y -= 4; // tiny 4pt gap — just enough for visual separation

      qNum++;
    }

    y -= 6; // small gap after section
  }

  // End of paper
  check(20);
  try {
    const epw = bold.widthOfTextAtSize('— End of Question Paper —', 8.5);
    txt('— End of Question Paper —', (PAGE_W - epw) / 2, y - 8, bold, 8.5, C.gray);
  } catch { txt('End of Question Paper', ML, y - 8, bold, 8.5, C.gray); }

  // ── FOOTER on every page ─────────────────────────────────
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    try {
      p.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: PAGE_W / 2 - 22, y: 18, size: 7, font: regular, color: C.gray,
      });
      p.drawText('Generated by VedaAI', {
        x: ML, y: 18, size: 7, font: regular, color: C.gray,
      });
    } catch { /* skip */ }
  });

  const bytes = await doc.save();
  logger.info(`PDF ready: ${bytes.length} bytes, ${pages.length} page(s)`);
  return bytes;
};
