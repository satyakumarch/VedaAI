// ============================================================
// VedaAI Backend - BullMQ AI Generation Queue
// ============================================================
import { Queue } from 'bullmq';
import { getBullMQConnection } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AIGenerationJobData {
  assignmentId: string;
  userId: string;
}

let aiQueue: Queue<AIGenerationJobData> | null = null;

export const getAIQueue = (): Queue<AIGenerationJobData> => {
  if (!aiQueue) {
    const connection = getBullMQConnection();
    aiQueue = new Queue<AIGenerationJobData>(config.queue.name, {
      connection,
      defaultJobOptions: {
        attempts: config.queue.attempts,
        backoff: { type: 'exponential', delay: config.queue.backoffDelay },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50 },
      },
    });
    aiQueue.on('error', (err) => logger.error('Queue error:', err));
    logger.info(`✅ BullMQ queue "${config.queue.name}" initialized`);
  }
  return aiQueue;
};

export const addGenerationJob = async (data: AIGenerationJobData): Promise<string> => {
  const queue = getAIQueue();
  const job   = await queue.add('generate-paper', data, {
    jobId: `gen-${data.assignmentId}-${Date.now()}`,
  });
  logger.info(`Job added: ${job.id} for assignment ${data.assignmentId}`);
  return job.id!;
};
