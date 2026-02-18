import { Queue, QueueOptions } from 'bullmq';
import redisClient from '../../infrastructure/redis';
import config from '../../infrastructure/config';
import { ScoringJobData } from './queue.types';

const queueOptions: QueueOptions = {
  connection: redisClient.getClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

export const scoringQueue = new Queue<ScoringJobData>('scoring', queueOptions);

/**
 * Add a job to the scoring queue
 */
export async function addScoringJob(data: ScoringJobData): Promise<void> {
  await scoringQueue.add('score-job', data, {
    jobId: `scoring-${data.jobId}`,
  });
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    scoringQueue.getWaitingCount(),
    scoringQueue.getActiveCount(),
    scoringQueue.getCompletedCount(),
    scoringQueue.getFailedCount(),
    scoringQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}
