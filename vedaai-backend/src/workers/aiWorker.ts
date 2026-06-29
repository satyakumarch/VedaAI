// ============================================================
// VedaAI Backend - BullMQ AI Generation Worker
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

connectDatabase();

const processJob = async (job: Job<AIGenerationJobData>): Promise<void> => {
  const { assignmentId, userId } = job.data;
  logger.info(`Processing job ${job.id} for assignment ${assignmentId}`);

  const emit = (progress: number, message: string) => {
    job.updateProgress(progress);
    emitToAssignment(assignmentId, 'generation_progress', {
      assignmentId, status: 'processing', progress, message,
    });
  };

  try {
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId, { status: 'processing' }, { new: true }
    );
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

    emitToAssignment(assignmentId, 'generation_started', {
      assignmentId, status: 'processing', progress: 5, message: 'Generation started...',
    });

    // Generate paper — result is IGeneratedPaperData directly
    const paperData = await generateQuestionPaper(assignment, emit);

    emit(90, 'Saving paper...');

    const allQuestions   = paperData.sections.flatMap(s => s.questions);
    const totalQuestions = allQuestions.length;
    const totalMarks     = paperData.sections.reduce((sum, s) => sum + s.totalMarks, 0);
    const difficultyBreakdown = allQuestions.reduce(
      (acc, q) => { acc[q.difficulty as Difficulty]++; return acc; },
      { easy: 0, medium: 0, hard: 0 }
    );

    await GeneratedPaper.deleteOne({ assignmentId });

    const paper = await GeneratedPaper.create({
      assignmentId, userId,
      sections: paperData.sections,
      totalMarks, totalQuestions, difficultyBreakdown,
      generatedAt: new Date(),
    });

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });

    emit(100, 'Question paper ready!');

    emitToAssignment(assignmentId, 'generation_completed', {
      assignmentId, status: 'completed', progress: 100,
      message: 'Question paper generated successfully!',
      data: paperData,
    });

    logger.info(`Job ${job.id} completed. Paper ID: ${paper._id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Job ${job.id} failed: ${message}`);
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
    emitToAssignment(assignmentId, 'generation_failed', {
      assignmentId, status: 'failed', progress: 0,
      message: `Generation failed: ${message}`,
    });
    throw error;
  }
};

const worker = new Worker<AIGenerationJobData>(
  config.queue.name, processJob,
  { connection: getBullMQConnection(), concurrency: config.queue.concurrency }
);

worker.on('completed', job => logger.info(`✅ Worker completed: ${job.id}`));
worker.on('failed',    (job, err) => logger.error(`❌ Worker failed: ${job?.id} — ${err.message}`));
worker.on('error',     err => logger.error('Worker error:', err));

logger.info(`🚀 AI Worker started on queue: "${config.queue.name}"`);

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
