// ============================================================
// VedaAI Backend - PDF Generation Service
// Clean, robust exam-paper style PDF using pdf-lib
// ============================================================
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { IGeneratedPaper } from '../models/GeneratedPaper';
import { IAssignment } from '../models/Assignment';
import { logger } from '../utils/logger';

// ── Page constants ──────────────────────────────────────────
const PAGE_W  = 595.28;  // A4 width  (pt)
const PAGE_H  = 841.89;  // A4 height (pt)
const MARGIN  = 50;
const CONTENT = PAGE_W - MARGIN * 2;

// ── Colors ──────────────────────────────────────────────────
const C = {
  black:    rgb(0,    0,    0),
  dark:     rgb(0.1,  0.1,  0.1),
  gray:     rgb(0.4,  0.4,  0.4),
  light:    rgb(0.7,  0.7,  0.7),
  bg:       rgb(0.96, 0.96, 0.96),
  white:    rgb(1,    1,    1),
  navy:     rgb(0.08, 0.18, 0.42),
  orange:   rgb(0.9,  0.38, 0.08),
  green:    rgb(0.1,  0.55, 0.25),
  amber:    rgb(0.75, 0.55, 0.0),
  red:      rgb(0.75, 0.1,  0.1),
};

// ── Text wrapper ────────────────────────────────────────────
function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  // Sanitize: remove non-latin characters that pdf-lib can't encode
  const safe  = text.replace(/[^\x00-\xFF]/g, '?');
  const words = safe.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    try {
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    } catch {
      line = test; // fallback if width check fails
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

// ── Safe text draw (never throws) ───────────────────────────
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = C.dark
): void {
  try {
    const safe = String(text ?? '').replace(/[^\x00-\xFF]/g, '?');
    page.drawText(safe, { x, y, size, font, color });
  } catch (e) {
    logger.warn(`PDF drawText failed: ${e}`);
  }
}

// ── Main export ─────────────────────────────────────────────
export const generateExamPDF = async (
  paper: IGeneratedPaper,
  assignment: IAssignment
): Promise<Uint8Array> => {
  logger.info(`Generating PDF for assignment: ${assignment._id}`);

  const doc  = await PDFDocument.create();
  doc.setTitle(String(assignment.title ?? 'Exam Paper'));
  doc.setAuthor('VedaAI');

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic  = await doc.embedFont(StandardFonts.HelveticaOblique);

  // State
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y    = PAGE_H - MARGIN;

  // ── Helpers ──────────────────────────────────────────────
  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y    = PAGE_H - MARGIN;
  };

  const checkSpace = (needed: number) => {
    if (y - needed < MARGIN + 30) newPage();
  };

  const drawLine = (yPos: number, thickness = 0.5, color = C.light) => {
    page.drawLine({
      start: { x: MARGIN, y: yPos },
      end:   { x: PAGE_W - MARGIN, y: yPos },
      thickness,
      color,
    });
  };

  const drawWrapped = (
    text: string,
    x: number,
    startY: number,
    font: PDFFont,
    size: number,
    color = C.dark,
    maxW = CONTENT,
    lineH = size + 4
  ): number => {
    const lines = wrapText(text, font, size, maxW);
    let cy = startY;
    for (const ln of lines) {
      checkSpace(lineH + 4);
      drawText(page, ln, x, cy, font, size, color);
      cy -= lineH;
    }
    return cy;
  };

  // ── Header ───────────────────────────────────────────────
  // Top color bar
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT, height: 5, color: C.navy });
  y -= 18;

  // Institution line
  drawText(page, 'VEDAAI ASSESSMENT PLATFORM', MARGIN, y, regular, 8, C.gray);
  y -= 20;

  // Title (centered)
  const title     = String(assignment.title ?? 'Exam Paper').toUpperCase();
  const titleLines = wrapText(title, bold, 16, CONTENT);
  for (const ln of titleLines) {
    try {
      const w = bold.widthOfTextAtSize(ln, 16);
      drawText(page, ln, (PAGE_W - w) / 2, y, bold, 16, C.navy);
    } catch {
      drawText(page, ln, MARGIN, y, bold, 16, C.navy);
    }
    y -= 22;
  }

  // Subject / Topic (centered)
  const subLine = `Subject: ${assignment.subject ?? ''}   |   Topic: ${assignment.topic ?? ''}`;
  try {
    const sw = regular.widthOfTextAtSize(subLine, 10);
    drawText(page, subLine, (PAGE_W - sw) / 2, y, regular, 10, C.gray);
  } catch {
    drawText(page, subLine, MARGIN, y, regular, 10, C.gray);
  }
  y -= 18;

  drawLine(y);
  y -= 14;

  // Marks / Date row
  const dueDate = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  drawText(page, `Total Marks: ${paper.totalMarks ?? 0}`, MARGIN, y, bold, 10);
  drawText(page, `Total Questions: ${paper.totalQuestions ?? 0}`, MARGIN + 160, y, regular, 10, C.gray);
  if (dueDate) drawText(page, `Due: ${dueDate}`, PAGE_W - MARGIN - 130, y, regular, 10, C.gray);
  y -= 20;

  // Student info box
  page.drawRectangle({ x: MARGIN, y: y - 58, width: CONTENT, height: 62, color: C.bg });
  drawText(page, 'Name: ___________________________', MARGIN + 10, y - 14, regular, 9);
  drawText(page, 'Roll No: ________________', MARGIN + 260, y - 14, regular, 9);
  drawText(page, 'Section: ________________', MARGIN + 10, y - 34, regular, 9);
  drawText(page, 'Date: ___________________', MARGIN + 260, y - 34, regular, 9);
  y -= 72;

  // Instructions
  if (assignment.instructions) {
    const instr = String(assignment.instructions).slice(0, 300);
    drawText(page, 'General Instructions:', MARGIN, y, bold, 9, C.navy);
    y -= 13;
    y = drawWrapped(instr, MARGIN + 8, y, italic, 8, C.gray, CONTENT - 8, 12);
    y -= 4;
  }

  drawLine(y, 1.5, C.navy);
  y -= 18;

  // ── Sections ─────────────────────────────────────────────
  let qNum = 1;

  for (const section of paper.sections) {
    checkSpace(50);

    // Section header bar
    page.drawRectangle({ x: MARGIN, y: y - 20, width: CONTENT, height: 24, color: C.navy });
    drawText(page, String(section.title ?? '').toUpperCase(), MARGIN + 8, y - 14, bold, 11, C.white);
    const marksLabel = `[${section.totalMarks ?? 0} Marks]`;
    try {
      const mw = bold.widthOfTextAtSize(marksLabel, 9);
      drawText(page, marksLabel, PAGE_W - MARGIN - mw - 6, y - 14, bold, 9, C.white);
    } catch {
      drawText(page, marksLabel, PAGE_W - MARGIN - 60, y - 14, bold, 9, C.white);
    }
    y -= 30;

    // Section instruction
    if (section.instruction) {
      y = drawWrapped(String(section.instruction), MARGIN, y, italic, 8, C.gray, CONTENT, 12);
      y -= 6;
    }

    // Questions
    for (const q of section.questions) {
      const qText   = String(q.question ?? '');
      const qLines  = wrapText(qText, regular, 9.5, CONTENT - 60);
      const optH    = q.options?.length ? q.options.length * 13 : 0;
      const answerH = q.type === 'long_answer' ? 80 : q.type === 'short_answer' ? 40 : 0;
      const needed  = qLines.length * 14 + optH + answerH + 20;
      checkSpace(needed);

      // Question number circle
      page.drawCircle({ x: MARGIN + 9, y: y - 1, size: 8, color: C.navy });
      drawText(page, String(qNum), MARGIN + 6, y - 4, bold, 7, C.white);

      // Difficulty badge
      const diffColor = q.difficulty === 'easy' ? C.green : q.difficulty === 'hard' ? C.red : C.amber;
      const diffLabel = (q.difficulty ?? 'medium').charAt(0).toUpperCase() + (q.difficulty ?? 'medium').slice(1);
      try {
        const dw = bold.widthOfTextAtSize(diffLabel, 6.5) + 6;
        page.drawRectangle({ x: PAGE_W - MARGIN - dw - 38, y: y - 8, width: dw, height: 11, color: diffColor });
        drawText(page, diffLabel, PAGE_W - MARGIN - dw - 35, y - 3, bold, 6.5, C.white);
      } catch { /* skip badge if it fails */ }

      // Marks
      drawText(page, `[${q.marks ?? 1}M]`, PAGE_W - MARGIN - 30, y, bold, 8, C.orange);

      // Question text
      const qStartX = MARGIN + 22;
      const qMaxW   = CONTENT - 65;
      let qy = y;
      for (const ln of qLines) {
        drawText(page, ln, qStartX, qy, regular, 9.5);
        qy -= 14;
      }
      y = qy - 2;

      // MCQ options
      if (q.options && q.options.length > 0) {
        for (const opt of q.options) {
          checkSpace(14);
          y = drawWrapped(String(opt ?? ''), MARGIN + 30, y, regular, 8.5, C.gray, CONTENT - 50, 13);
        }
      }

      // Answer lines
      if (q.type === 'short_answer') {
        y -= 4;
        for (let i = 0; i < 3; i++) {
          checkSpace(16);
          drawLine(y, 0.4, C.light);
          y -= 14;
        }
      } else if (q.type === 'long_answer') {
        y -= 4;
        for (let i = 0; i < 6; i++) {
          checkSpace(16);
          drawLine(y, 0.4, C.light);
          y -= 14;
        }
      }

      y -= 10;
      qNum++;
    }

    y -= 8;
  }

  // ── Footer on every page ─────────────────────────────────
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    try {
      p.drawText(`Page ${idx + 1} of ${pages.length}`, {
        x: PAGE_W / 2 - 25, y: 22, size: 7, font: regular, color: C.gray,
      });
      p.drawText('Generated by VedaAI', {
        x: MARGIN, y: 22, size: 7, font: regular, color: C.gray,
      });
    } catch { /* skip footer if it fails */ }
  });

  const bytes = await doc.save();
  logger.info(`PDF generated: ${bytes.length} bytes, ${pages.length} pages`);
  return bytes;
};
