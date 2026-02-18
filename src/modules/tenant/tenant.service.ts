import tenantRepository from './tenant.repository';
import { CreateTenantDto, UpdateTenantDto, PLAN_LIMITS, TenantPlan } from './tenant.types';
import { Tenant } from '@prisma/client';
import logger from '../../infrastructure/logger';
import { AppError } from '../../middlewares/error.middleware';

export class TenantService {
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    try {
      const tenant = await tenantRepository.create(data);
      logger.info('Tenant created', { tenantId: tenant.id, name: tenant.name });
      return tenant;
    } catch (error) {
      logger.error('Error creating tenant', { error });
      throw new AppError('Failed to create tenant', 500);
    }
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    try {
      return await tenantRepository.findById(id);
    } catch (error) {
      logger.error('Error fetching tenant', { tenantId: id, error });
      throw new AppError('Failed to fetch tenant', 500);
    }
  }

  async getAllTenants(skip?: number, take?: number): Promise<Tenant[]> {
    try {
      return await tenantRepository.findAll(skip, take);
    } catch (error) {
      logger.error('Error fetching tenants', { error });
      throw new AppError('Failed to fetch tenants', 500);
    }
  }

  async updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant> {
    try {
      return await tenantRepository.update(id, data);
    } catch (error) {
      logger.error('Error updating tenant', { tenantId: id, error });
      throw new AppError('Failed to update tenant', 500);
    }
  }

  async checkPlanLimit(tenantId: string): Promise<{ allowed: boolean; currentCount: number; limit: number | null }> {
    try {
      const tenant = await tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      const currentCount = await tenantRepository.countJobs(tenantId);
      const limit = PLAN_LIMITS[tenant.plan as TenantPlan].maxJobs;

      return {
        allowed: limit === null || currentCount < limit,
        currentCount,
        limit,
      };
    } catch (error) {
      logger.error('Error checking plan limit', { tenantId, error });
      throw error;
    }
  }

  async getJobCount(tenantId: string): Promise<number> {
    return tenantRepository.countJobs(tenantId);
  }

  /**
   * Process pending_upgrade jobs after plan upgrade
   * Moves them to queued status and adds to scoring queue
   */
  async processPendingJobsAfterUpgrade(tenantId: string): Promise<number> {
    try {
      logger.info('Processing pending jobs after upgrade', { tenantId });

      // Get all pending_upgrade jobs for this tenant
      const pendingJobs = await tenantRepository.findPendingUpgradeJobs(tenantId);

      if (pendingJobs.length === 0) {
        logger.info('No pending jobs to process', { tenantId });
        return 0;
      }

      logger.info(`Found ${pendingJobs.length} pending jobs to process`, { tenantId });

      // Import here to avoid circular dependency
      const { addScoringJob } = await import('../queue/scoring.queue');
      const jobRepository = (await import('../jobs/job.repository')).default;
      const jobStateMachine = (await import('../../stateMachine/jobStateMachine')).default;

      let processedCount = 0;

      for (const job of pendingJobs) {
        try {
          // Validate state transition: pending_upgrade -> queued
          jobStateMachine.validateTransition('pending_upgrade', 'queued');

          // Update status to queued
          await jobRepository.updateStatusForWebhook(job.id, tenantId, 'queued');

          // Add to scoring queue
          await addScoringJob({
            jobId: job.id,
            title: job.title,
            description: job.description,
            tenantId,
          });

          processedCount++;
          logger.debug('Pending job processed and queued', { jobId: job.id, tenantId });
        } catch (error) {
          logger.error('Failed to process pending job', {
            jobId: job.id,
            tenantId,
            error,
          });
        }
      }

      logger.info(`Processed ${processedCount} pending jobs after upgrade`, {
        tenantId,
        total: pendingJobs.length,
        processed: processedCount,
      });

      return processedCount;
    } catch (error) {
      logger.error('Error processing pending jobs after upgrade', { tenantId, error });
      throw error;
    }
  }
}

export default new TenantService();
