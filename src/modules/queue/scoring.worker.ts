import { Worker, WorkerOptions } from 'bullmq';
import redisClient from '../../infrastructure/redis';
import config from '../../infrastructure/config';
import webhookService from '../webhook/webhook.service';
import jobRepository from '../jobs/job.repository';
import jobStateMachine from '../../stateMachine/jobStateMachine';
import logger from '../../infrastructure/logger';
import { ScoringJobData, ScoringJobResult } from './queue.types';
import { Job } from 'bullmq';

const workerOptions: WorkerOptions = {
  connection: redisClient.getClient(),
  concurrency: config.queueConcurrency,
  limiter: {
    max: 10, // Process max 10 jobs per interval
    duration: 1000, // Per second
  },
};

/**
 * Process scoring jobs
 */
async function processScoringJob(job: Job<ScoringJobData>): Promise<ScoringJobResult> {
  const { jobId } = job.data;

  try {
    logger.info('Processing scoring job', {
      jobId,
      queueJobId: job.id,
      attempt: job.attemptsMade + 1,
    });

    // Verify job exists and is in 'queued' status
    const tenantId = job.data.tenantId;
    const dbJob = await jobRepository.findByIdForWebhook(jobId);
    if (!dbJob) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Ensure job belongs to the correct tenant
    if (dbJob.tenantId !== tenantId) {
      throw new Error(`Job ${jobId} does not belong to tenant ${tenantId}`);
    }

    // Validate state transition: new -> queued (should already be queued)
    if (dbJob.status !== 'queued') {
      // If status is not queued, try to transition from new to queued
      if (dbJob.status === 'new') {
        jobStateMachine.validateTransition('new', 'queued');
        await jobRepository.updateStatusForWebhook(jobId, tenantId, 'queued');
      } else {
        throw new Error(
          `Job ${jobId} is in invalid state: ${dbJob.status}. Expected 'queued' or 'new'.`
        );
      }
    }

    // Send to n8n webhook
    await webhookService.sendJobToN8n(dbJob);

    logger.info('Successfully sent job to n8n webhook', {
      jobId,
      queueJobId: job.id,
    });

    return {
      success: true,
      jobId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to process scoring job', {
      jobId,
      queueJobId: job.id,
      attempt: job.attemptsMade + 1,
      error: errorMessage,
    });

    // If max attempts reached, mark job as failed in DB
    if (job.attemptsMade >= 2) {
      try {
        const tenantId = job.data.tenantId;
        await jobRepository.updateStatusForWebhook(jobId, tenantId, 'new'); // Revert to new
        logger.warn('Job reverted to new status after max retries', { jobId, tenantId });
      } catch (dbError) {
        logger.error('Failed to revert job status', { jobId, error: dbError });
      }
    }

    throw error; // Re-throw to trigger retry
  }
}

/**
 * Create and start the scoring worker
 */
export function createScoringWorker(): Worker<ScoringJobData, ScoringJobResult> {
  const worker = new Worker<ScoringJobData, ScoringJobResult>(
    'scoring',
    processScoringJob,
    workerOptions
  );

  worker.on('completed', (job) => {
    logger.info('Scoring job completed', {
      jobId: job.data.jobId,
      queueJobId: job.id,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Scoring job failed', {
      jobId: job?.data.jobId,
      queueJobId: job?.id,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', { error: error.message });
  });

  logger.info('Scoring worker started', {
    concurrency: config.queueConcurrency,
  });

  return worker;
}
