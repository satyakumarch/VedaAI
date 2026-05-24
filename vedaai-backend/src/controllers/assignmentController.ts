// ============================================================
// VedaAI Backend - Assignment Controller
// ============================================================
import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { addGenerationJob } from '../queues/aiQueue';
import { extractTextFromFile } from '../services/fileService';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { createAssignmentSchema } from '../utils/validators';
import { logger } from '../utils/logger';

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // ── 1. Validate & coerce all fields (handles JSON strings from FormData) ──
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Assignment validation failed:', errors);
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  const body = parsed.data;

  // ── 2. Extract text from uploaded file (optional) ──
  let uploadedContent: string | undefined;
  let uploadedFileName: string | undefined;
  if (req.file) {
    try {
      uploadedContent  = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      uploadedFileName = req.file.originalname;
    } catch (err) {
      logger.warn('File extraction failed (non-fatal):', err);
    }
  }

  // ── 3. Save assignment to DB ──
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
    status: 'queued',
  });

  logger.info(`Assignment saved: ${assignment._id}`);

  // ── 4. Try to queue the generation job ──
  let jobId: string | null = null;
  try {
    jobId = await addGenerationJob({
      assignmentId: assignment._id.toString(),
      userId,
    });
    assignment.jobId = jobId;
    await assignment.save();
    logger.info(`Job queued: ${jobId}`);
  } catch (queueErr) {
    // Redis/BullMQ not available — mark as failed so user can retry
    logger.error('Queue unavailable, marking assignment as failed:', queueErr);
    assignment.status = 'failed';
    await assignment.save();
  }

  // ── 5. Invalidate cache ──
  try {
    await cacheDel(`assignments:${userId}`);
  } catch {
    // Cache failure is non-fatal
  }

  sendCreated(res, { assignment, jobId }, 'Assignment created and queued for generation');
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const page   = parseInt(req.query.page as string) || 1;
  const limit  = parseInt(req.query.limit as string) || 20;
  const skip   = (page - 1) * limit;

  // Try cache first
  const cacheKey = `assignments:${userId}:${page}:${limit}`;
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Assignments retrieved (cached)');
      return;
    }
  } catch {
    // Cache miss — continue to DB
  }

  const [assignments, total] = await Promise.all([
    Assignment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Assignment.countDocuments({ userId }),
  ]);

  const data = {
    assignments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };

  try {
    await cacheSet(cacheKey, data, 60);
  } catch {
    // Non-fatal
  }

  sendSuccess(res, data);
};

export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const assignment = await Assignment.findOne({ _id: id, userId }).lean();
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }
  sendSuccess(res, assignment);
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const assignment = await Assignment.findOneAndDelete({ _id: id, userId });
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }

  await GeneratedPaper.deleteOne({ assignmentId: id });

  try { await cacheDel(`assignments:${userId}`); } catch { /* non-fatal */ }

  sendSuccess(res, null, 'Assignment deleted');
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const assignment = await Assignment.findOne({ _id: id, userId });
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }

  assignment.status = 'queued';
  await assignment.save();

  await GeneratedPaper.findOneAndUpdate(
    { assignmentId: id },
    { $inc: { regenerationCount: 1 } }
  );

  try {
    const jobId = await addGenerationJob({ assignmentId: id, userId });
    assignment.jobId = jobId;
    await assignment.save();
    sendSuccess(res, { jobId }, 'Regeneration queued');
  } catch (err) {
    assignment.status = 'failed';
    await assignment.save();
    logger.error('Regeneration queue failed:', err);
    sendError(res, 'Queue unavailable. Please check Redis connection.', 503);
  }
};
