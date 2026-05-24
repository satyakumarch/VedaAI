// ============================================================
// VedaAI Backend - Generated Paper Controller
// ============================================================
import { Request, Response } from 'express';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { Assignment } from '../models/Assignment';
import { generateExamPDF } from '../services/pdfService';
import { cacheGet, cacheSet } from '../config/redis';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const getPaper = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;
  const userId = req.user!.userId;

  const cacheKey = `paper:${assignmentId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    sendSuccess(res, cached, 'Paper retrieved (cached)');
    return;
  }

  const paper = await GeneratedPaper.findOne({ assignmentId, userId })
    .populate('assignmentId')
    .lean();

  if (!paper) {
    sendError(res, 'Generated paper not found', 404);
    return;
  }

  await cacheSet(cacheKey, paper, 300); // cache 5 min
  sendSuccess(res, paper);
};

export const downloadPDF = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;
  const userId = req.user!.userId;

  const [paper, assignment] = await Promise.all([
    GeneratedPaper.findOne({ assignmentId, userId }),
    Assignment.findOne({ _id: assignmentId, userId }),
  ]);

  if (!paper || !assignment) {
    sendError(res, 'Paper or assignment not found', 404);
    return;
  }

  try {
    const pdfBytes = await generateExamPDF(paper, assignment);
    const filename = `${String(assignment.title).replace(/[^a-z0-9]/gi, '_')}_exam.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('PDF generation error:', err);
    sendError(res, `PDF generation failed: ${msg}`, 500);
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId, sectionIndex, questionIndex } = req.params;
  const userId = req.user!.userId;
  const { question, marks, difficulty } = req.body;

  const paper = await GeneratedPaper.findOne({ assignmentId, userId });
  if (!paper) {
    sendError(res, 'Paper not found', 404);
    return;
  }

  const si = parseInt(sectionIndex);
  const qi = parseInt(questionIndex);

  if (!paper.sections[si] || !paper.sections[si].questions[qi]) {
    sendError(res, 'Question not found', 404);
    return;
  }

  if (question) paper.sections[si].questions[qi].question = question;
  if (marks) paper.sections[si].questions[qi].marks = marks;
  if (difficulty) paper.sections[si].questions[qi].difficulty = difficulty;

  // Recalculate section total marks
  paper.sections[si].totalMarks = paper.sections[si].questions.reduce(
    (sum, q) => sum + q.marks,
    0
  );

  await paper.save();
  sendSuccess(res, paper, 'Question updated');
};
