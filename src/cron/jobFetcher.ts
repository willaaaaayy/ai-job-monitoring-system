import { schedule } from 'node-cron';
import jobService from '../modules/jobs/job.service';
import logger from '../infrastructure/logger';

/**
 * Fetches jobs from the API, saves them to the database,
 * and adds them to the scoring queue
 * Uses the new fetchAndProcessJobs method from JobService
 */
async function fetchAndProcessJobs(userId: string, tenantId: string): Promise<void> {
  try {
    logger.info('Starting scheduled job fetch', { userId, tenantId });

    // Use the new unified method that handles everything
    const result = await jobService.fetchAndProcessJobs(userId, tenantId);

    logger.info('Completed scheduled job fetch', {
      userId,
      tenantId,
      fetched: result.fetched,
      saved: result.saved,
      queued: result.queued,
      pendingUpgrade: result.pendingUpgrade,
      errors: result.errors.length,
    });
  } catch (error) {
    logger.error('Error in scheduled job fetch', { error, userId, tenantId });
  }
}

/**
 * Initialize cron job to run every 6 hours
 * Cron expression runs at minute 0 of every 6th hour (e.g., 0:00, 6:00, 12:00, 18:00)
 * 
 * Note: This requires a userId. In a real SaaS, you might want to:
 * - Fetch jobs for all active users
 * - Or have per-user cron jobs
 * - Or use a different approach
 */
export function startJobFetcherCron(userId?: string, tenantId?: string): void {
  if (!userId || !tenantId) {
    logger.warn('Job fetcher cron requires userId and tenantId. Skipping cron setup.');
    return;
  }

  // Schedule to run every 6 hours
  schedule('0 */6 * * *', async () => {
    await fetchAndProcessJobs(userId, tenantId);
  });

  logger.info('Job fetcher cron job started. Will run every 6 hours.', { userId, tenantId });
}

/**
 * Manually trigger job fetch (useful for testing or manual triggers)
 */
export async function triggerJobFetch(userId: string, tenantId: string): Promise<void> {
  await fetchAndProcessJobs(userId, tenantId);
}
