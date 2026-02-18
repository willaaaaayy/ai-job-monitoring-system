import { emitToTenant } from '../../infrastructure/socket';
import logger from '../../infrastructure/logger';
import { Job } from '@prisma/client';

export class WebSocketService {
  /**
   * Emit job_updated event when job status changes
   */
  emitJobUpdated(tenantId: string, job: Job): void {
    try {
      emitToTenant(tenantId, 'job_updated', {
        jobId: job.id,
        status: job.status,
        score: job.score,
        updatedAt: job.updatedAt,
      });
      logger.debug('Emitted job_updated event', { tenantId, jobId: job.id });
    } catch (error) {
      logger.error('Error emitting job_updated event', { error, tenantId, jobId: job.id });
    }
  }

  /**
   * Emit job_scored event when new scoring is received
   */
  emitJobScored(tenantId: string, job: Job, score: number, reason: string): void {
    try {
      emitToTenant(tenantId, 'job_scored', {
        jobId: job.id,
        score,
        reason,
        status: job.status,
        updatedAt: job.updatedAt,
      });
      logger.debug('Emitted job_scored event', { tenantId, jobId: job.id, score });
    } catch (error) {
      logger.error('Error emitting job_scored event', { error, tenantId, jobId: job.id });
    }
  }

  /**
   * Emit jobs_created event when new jobs are fetched
   */
  emitJobsCreated(
    tenantId: string,
    count: number,
    stats: { queued: number; pendingUpgrade: number }
  ): void {
    try {
      emitToTenant(tenantId, 'jobs_created', {
        count,
        queued: stats.queued,
        pendingUpgrade: stats.pendingUpgrade,
        timestamp: new Date().toISOString(),
      });
      logger.debug('Emitted jobs_created event', { tenantId, count, stats });
    } catch (error) {
      logger.error('Error emitting jobs_created event', { error, tenantId });
    }
  }
}

export default new WebSocketService();
