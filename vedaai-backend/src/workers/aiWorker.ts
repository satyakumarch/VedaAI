// ============================================================
// VedaAI Backend - BullMQ AI Generation Worker
// Processes AI generation jobs from the queue
// ============================================================
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import { getBullMQConnection } from '../config/redis';
import { connectDatabase } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { generateQuestionPaper } from '../services/aiService';
import { emitToAssignment } from '../websocket/socketManager';
import { AIGenerationJobData } from '../queues/aiQueue';
import { Difficulty } from '../types';

// Connect to DB before processing
connectDatabase();

const processJob = async (job: Job<AIGenerationJobData>): Promise<void> => {
  const { assignmentId, userId } = job.data;
  logger.info(`Processing job ${job.id} for assignment ${assignmentId}`);

  // Helper to emit progress
  const emitProgress = (progress: number, message: string) => {
    job.updateProgress(progress);
    emitToAssignment(assignmentId, 'generation_progress', {
      assignmentId,
      status: 'processing',
      progress,
      message,
    });
  };

  try {
    // 1. Update assignment status to processing
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { status: 'processing' },
      { new: true }
    );

    if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

    // Emit started event
    emitToAssignment(assignmentId, 'generation_started', {
      assignmentId,
      status: 'processing',
      progress: 5,
      message: 'Generation started...',
    });

    emitProgress(10, 'Preparing AI prompt...');

    // 2. Generate question paper via AI
    const paperData = await generateQuestionPaper(assignment, emitProgress);

    emitProgress(90, 'Saving generated paper...');

    // 3. Calculate stats
    const allQuestions = paperData.sections.flatMap((s) => s.questions);
    const totalQuestions = allQuestions.length;
    const totalMarks = paperData.sections.reduce((sum, s) => sum + s.totalMarks, 0);

    const difficultyBreakdown = allQuestions.reduce(
      (acc, q) => {
        acc[q.difficulty as Difficulty]++;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    // 4. Delete any existing paper for this assignment (regeneration)
    await GeneratedPaper.deleteOne({ assignmentId });

    // 5. Save generated paper
    const paper = await GeneratedPaper.create({
      assignmentId,
      userId,
      sections: paperData.sections,
      totalMarks,
      totalQuestions,
      difficultyBreakdown,
      generatedAt: new Date(),
    });

    // 6. Update assignment status to completed
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
    });

    emitProgress(100, 'Question paper ready!');

    // 7. Emit completion event with paper data
    emitToAssignment(assignmentId, 'generation_completed', {
      assignmentId,
      status: 'completed',
      progress: 100,
      message: 'Question paper generated successfully!',
      data: paperData,
    });

    logger.info(`Job ${job.id} completed. Paper ID: ${paper._id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Job ${job.id} failed:`, error);

    // Update assignment status to failed
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });

    // Emit failure event
    emitToAssignment(assignmentId, 'generation_failed', {
      assignmentId,
      status: 'failed',
      progress: 0,
      message: `Generation failed: ${message}`,
    });

    throw error; // Re-throw so BullMQ handles retries
  }
};

// ── Worker Instance ──────────────────────────────────────────
const worker = new Worker<AIGenerationJobData>(
  config.queue.name,
  processJob,
  {
    connection: getBullMQConnection(),
    concurrency: config.queue.concurrency,
  }
);

worker.on('completed', (job) => {
  logger.info(`✅ Worker completed job: ${job.id}`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Worker failed job: ${job?.id} — ${err.message}`);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

logger.info(`🚀 AI Worker started. Listening on queue: "${config.queue.name}"`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await worker.close();
  process.exit(0);
});
