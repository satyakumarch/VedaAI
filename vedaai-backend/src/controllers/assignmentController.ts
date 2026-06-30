// ============================================================
// VedaAI Backend - Assignment Controller
// Inline generation (no queue delay) for fast response
// ============================================================
import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { generateQuestionPaper } from '../services/aiService';
import { emitToAssignment } from '../websocket/socketManager';
import { extractTextFromFile } from '../services/fileService';
import { cacheDel } from '../config/redis';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { createAssignmentSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { Difficulty } from '../types';

// Try to add to queue — non-fatal if Redis is down
const tryQueue = async (assignmentId: string, userId: string): Promise<string | null> => {
  try {
    const { addGenerationJob } = await import('../queues/aiQueue');
    return await addGenerationJob({ assignmentId, userId });
  } catch {
    return null;
  }
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // Validate
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }
  const body = parsed.data;

  // File extraction
  let uploadedContent: string | undefined;
  let uploadedFileName: string | undefined;
  if (req.file) {
    try {
      uploadedContent  = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      uploadedFileName = req.file.originalname;
    } catch { /* non-fatal */ }
  }

  // Save assignment
  const assignment = await Assignment.create({
    userId,
    title:                  body.title,
    subject:                body.subject,
    topic:                  body.topic,
    dueDate:                new Date(body.dueDate),
    questionTypes:          body.questionTypes,
    numberOfQuestions:      body.numberOfQuestions,
    totalMarks:             body.totalMarks,
    difficultyDistribution: body.difficultyDistribution,
    instructions:           body.instructions ?? '',
    uploadedContent,
    uploadedFileName,
    status: 'processing',   // start as processing immediately
  });

  logger.info(`Assignment saved: ${assignment._id} — starting inline generation`);

  // Respond immediately so frontend can redirect to generating page
  sendCreated(res, { assignment, jobId: null }, 'Assignment created — generating now');

  // ── Generate inline (async, after response sent) ──
  setImmediate(async () => {
    try {
      emitToAssignment(assignment._id.toString(), 'generation_started', {
        assignmentId: assignment._id.toString(),
        status: 'processing', progress: 5, message: 'Generation started...',
      });

      const emitProgress = (progress: number, message: string) => {
        emitToAssignment(assignment._id.toString(), 'generation_progress', {
          assignmentId: assignment._id.toString(),
          status: 'processing', progress, message,
        });
      };

      const paperData = await generateQuestionPaper(assignment, emitProgress);

      emitProgress(90, 'Saving paper...');

      const allQuestions   = paperData.sections.flatMap(s => s.questions);
      const totalQuestions = allQuestions.length;
      const totalMarks     = paperData.sections.reduce((s, sec) => s + sec.totalMarks, 0);
      const difficultyBreakdown = allQuestions.reduce(
        (acc, q) => { acc[q.difficulty as Difficulty]++; return acc; },
        { easy: 0, medium: 0, hard: 0 }
      );

      await GeneratedPaper.deleteOne({ assignmentId: assignment._id });
      await GeneratedPaper.create({
        assignmentId: assignment._id, userId,
        sections: paperData.sections,
        totalMarks, totalQuestions, difficultyBreakdown,
        generatedAt: new Date(),
      });

      await Assignment.findByIdAndUpdate(assignment._id, { status: 'completed' });
      try { await cacheDel(`assignments:${userId}`); } catch { /* non-fatal */ }

      emitProgress(100, 'Question paper ready!');
      emitToAssignment(assignment._id.toString(), 'generation_completed', {
        assignmentId: assignment._id.toString(),
        status: 'completed', progress: 100,
        message: 'Question paper generated successfully!',
        data: paperData,
      });

      logger.info(`✅ Inline generation complete for ${assignment._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Inline generation failed for ${assignment._id}: ${msg}`);
      logger.error('Full error:', err);
      await Assignment.findByIdAndUpdate(assignment._id, { status: 'failed' });
      emitToAssignment(assignment._id.toString(), 'generation_failed', {
        assignmentId: assignment._id.toString(),
        status: 'failed', progress: 0, message: `Generation failed: ${msg}`,
      });
    }
  });
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const page   = parseInt(req.query.page as string) || 1;
  const limit  = parseInt(req.query.limit as string) || 20;
  const skip   = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    Assignment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Assignment.countDocuments({ userId }),
  ]);

  sendSuccess(res, {
    assignments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id }   = req.params;
  const userId   = req.user!.userId;
  const assignment = await Assignment.findOne({ _id: id, userId }).lean();
  if (!assignment) { sendError(res, 'Assignment not found', 404); return; }
  sendSuccess(res, assignment);
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const assignment = await Assignment.findOneAndDelete({ _id: id, userId });
  if (!assignment) { sendError(res, 'Assignment not found', 404); return; }
  await GeneratedPaper.deleteOne({ assignmentId: id });
  try { await cacheDel(`assignments:${userId}`); } catch { /* non-fatal */ }
  sendSuccess(res, null, 'Assignment deleted');
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const assignment = await Assignment.findOne({ _id: id, userId });
  if (!assignment) { sendError(res, 'Assignment not found', 404); return; }

  assignment.status = 'processing';
  await assignment.save();

  await GeneratedPaper.findOneAndUpdate(
    { assignmentId: id }, { $inc: { regenerationCount: 1 } }
  );

  sendSuccess(res, { jobId: null }, 'Regeneration started');

  // Inline regeneration
  setImmediate(async () => {
    try {
      emitToAssignment(id, 'generation_started', {
        assignmentId: id, status: 'processing', progress: 5, message: 'Regenerating...',
      });

      const emitProgress = (progress: number, message: string) => {
        emitToAssignment(id, 'generation_progress', {
          assignmentId: id, status: 'processing', progress, message,
        });
      };

      const paperData = await generateQuestionPaper(assignment, emitProgress);

      const allQuestions   = paperData.sections.flatMap(s => s.questions);
      const totalMarks     = paperData.sections.reduce((s, sec) => s + sec.totalMarks, 0);
      const difficultyBreakdown = allQuestions.reduce(
        (acc, q) => { acc[q.difficulty as Difficulty]++; return acc; },
        { easy: 0, medium: 0, hard: 0 }
      );

      await GeneratedPaper.deleteOne({ assignmentId: id });
      await GeneratedPaper.create({
        assignmentId: id, userId,
        sections: paperData.sections,
        totalMarks, totalQuestions: allQuestions.length,
        difficultyBreakdown, generatedAt: new Date(),
      });

      await Assignment.findByIdAndUpdate(id, { status: 'completed' });

      emitProgress(100, 'Paper ready!');
      emitToAssignment(id, 'generation_completed', {
        assignmentId: id, status: 'completed', progress: 100,
        message: 'Regenerated successfully!', data: paperData,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await Assignment.findByIdAndUpdate(id, { status: 'failed' });
      emitToAssignment(id, 'generation_failed', {
        assignmentId: id, status: 'failed', progress: 0, message: `Failed: ${msg}`,
      });
    }
  });
};
