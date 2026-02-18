import { z } from 'zod';
import jobService from '../jobs/job.service';
import scoringHistoryService from '../scoring-history/scoring-history.service';
import jobRepository from '../jobs/job.repository';
import logger from '../../infrastructure/logger';

export const scoringWebhookSchema = z.object({
  jobId: z.string().uuid('Invalid jobId format'),
  score: z.number().int().min(1).max(10),
  reason: z.string().min(1, 'Reason cannot be empty'),
  tenantId: z.string().uuid().optional(), // Optional for backward compatibility
});

export type ScoringWebhookPayload = z.infer<typeof scoringWebhookSchema>;

export class ScoringService {
  async processScoringResult(payload: ScoringWebhookPayload): Promise<void> {
    try {
      logger.info('Processing scoring result', { jobId: payload.jobId });

      // Get job to extract tenantId if not provided
      const job = await jobRepository.findByIdForWebhook(payload.jobId);
      if (!job) {
        throw new Error(`Job with id ${payload.jobId} not found`);
      }

      const tenantId = payload.tenantId || job.tenantId;

      // Create scoring history record
      await scoringHistoryService.createHistory({
        jobId: payload.jobId,
        score: payload.score,
        reason: payload.reason,
      });

      // Update job score and status
      await jobService.updateJobScoreForWebhook(payload.jobId, tenantId, {
        score: payload.score,
        reason: payload.reason,
      });

      logger.info('Successfully processed scoring result', {
        jobId: payload.jobId,
        score: payload.score,
        tenantId,
      });
    } catch (error) {
      logger.error('Error processing scoring result', {
        jobId: payload.jobId,
        error,
      });
      throw error;
    }
  }
}

export default new ScoringService();
