import jobRepository from './job.repository';
import { CreateJobDto, JobStatus, UpdateJobScoreDto } from './job.types';
import logger from '../../infrastructure/logger';
import { NotFoundError } from '../../middlewares/error.middleware';
import jobStateMachine from '../../stateMachine/jobStateMachine';
import webSocketService from '../websocket/websocket.service';
import tenantService from '../tenant/tenant.service';
import mockJobApi from '../../mock/jobApi';
import { addScoringJob } from '../queue/scoring.queue';

export class JobService {
  async fetchAndSaveJobs(jobs: CreateJobDto[], userId: string, tenantId: string): Promise<number> {
    try {
      const result = await jobRepository.createMany(jobs, userId, tenantId);
      logger.info(`Saved ${result.count} new jobs to database`, { userId, tenantId });
      return result.count;
    } catch (error) {
      logger.error('Error saving jobs', { error, userId, tenantId });
      throw error;
    }
  }

  async getAllJobs(
    tenantId: string,
    userId?: string,
    skip?: number,
    take?: number,
    filters?: {
      status?: string | string[];
      minScore?: number;
      maxScore?: number;
      startDate?: string;
      endDate?: string;
      searchQuery?: string;
    }
  ) {
    try {
      // Convert string dates to Date objects
      const filterParams = filters
        ? {
            status: filters.status as JobStatus | JobStatus[] | undefined,
            minScore: filters.minScore,
            maxScore: filters.maxScore,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            searchQuery: filters.searchQuery,
          }
        : undefined;

      const [jobs, total] = await Promise.all([
        jobRepository.findAll(tenantId, userId, skip, take, filterParams),
        jobRepository.count(tenantId, userId, filterParams),
      ]);

      return {
        jobs,
        total,
        skip: skip || 0,
        take: take || total,
      };
    } catch (error) {
      logger.error('Error fetching jobs', { error, userId, tenantId });
      throw error;
    }
  }

  async searchJobs(
    tenantId: string,
    userId: string | undefined,
    query: string,
    skip?: number,
    take?: number
  ) {
    try {
      const jobs = await jobRepository.search(tenantId, userId, query, skip, take);
      const total = await jobRepository.count(tenantId, userId, { searchQuery: query });

      return {
        jobs,
        total,
        skip: skip || 0,
        take: take || total,
      };
    } catch (error) {
      logger.error('Error searching jobs', { error, userId, tenantId, query });
      throw error;
    }
  }

  async getJobById(id: string, tenantId: string, userId?: string) {
    try {
      const job = await jobRepository.findById(id, tenantId, userId);
      if (!job) {
        throw new NotFoundError(`Job with id ${id} not found`);
      }
      return job;
    } catch (error) {
      logger.error('Error fetching job by id', { id, userId, tenantId, error });
      throw error;
    }
  }

  async updateJobScore(
    jobId: string,
    updateData: UpdateJobScoreDto,
    tenantId: string,
    userId?: string
  ): Promise<void> {
    try {
      const job = await jobRepository.findById(jobId, tenantId, userId);

      if (!job) {
        throw new NotFoundError(`Job with id ${jobId} not found`);
      }

      // Validate state transition using state machine
      jobStateMachine.validateTransition(job.status as JobStatus, 'scored');

      // Validate score range
      if (updateData.score < 1 || updateData.score > 10) {
        throw new Error('Score must be between 1 and 10');
      }

      const updatedJob = await jobRepository.updateStatus(
        jobId,
        'scored',
        tenantId,
        userId,
        updateData.score,
        updateData.reason
      );

      // Emit WebSocket event
      webSocketService.emitJobUpdated(tenantId, updatedJob);

      logger.info(`Updated job ${jobId} with score ${updateData.score}`, { userId, tenantId });
    } catch (error) {
      logger.error('Error updating job score', { jobId, userId, tenantId, error });
      throw error;
    }
  }

  async getJobsByStatus(status: JobStatus, tenantId: string, userId?: string) {
    try {
      return await jobRepository.findByStatus(status, tenantId, userId);
    } catch (error) {
      logger.error('Error fetching jobs by status', { status, userId, tenantId, error });
      throw error;
    }
  }

  /**
   * Update job status for webhook processing (no userId check, but requires tenantId)
   */
  async updateJobScoreForWebhook(
    jobId: string,
    tenantId: string,
    updateData: UpdateJobScoreDto
  ): Promise<void> {
    try {
      const job = await jobRepository.findByIdForWebhook(jobId);

      if (!job) {
        throw new NotFoundError(`Job with id ${jobId} not found`);
      }

      // Ensure tenant matches
      if (job.tenantId !== tenantId) {
        throw new NotFoundError(`Job with id ${jobId} not found for tenant`);
      }

      // Validate state transition: queued -> scored
      jobStateMachine.validateTransition(job.status as JobStatus, 'scored');

      // Validate score range
      if (updateData.score < 1 || updateData.score > 10) {
        throw new Error('Score must be between 1 and 10');
      }

      const updatedJob = await jobRepository.updateStatusForWebhook(
        jobId,
        tenantId,
        'scored',
        updateData.score,
        updateData.reason
      );

      // Emit WebSocket events
      webSocketService.emitJobUpdated(tenantId, updatedJob);
      webSocketService.emitJobScored(tenantId, updatedJob, updateData.score, updateData.reason);

      logger.info(`Updated job ${jobId} with score ${updateData.score} via webhook`, { tenantId });
    } catch (error) {
      logger.error('Error updating job score via webhook', { jobId, tenantId, error });
      throw error;
    }
  }

  /**
   * Fetch jobs from API, save to database, and add to queue
   * Returns statistics about the operation
   */
  async fetchAndProcessJobs(
    userId: string,
    tenantId: string
  ): Promise<{
    fetched: number;
    saved: number;
    queued: number;
    pendingUpgrade: number;
    errors: string[];
  }> {
    const result = {
      fetched: 0,
      saved: 0,
      queued: 0,
      pendingUpgrade: 0,
      errors: [] as string[],
    };

    try {
      logger.info('Starting job fetch and process', { userId, tenantId });

      // 1. Fetch jobs from API
      const jobs = await mockJobApi.fetchJobs();
      result.fetched = jobs.length;
      logger.info(`Fetched ${jobs.length} jobs from API`, { userId, tenantId });

      if (jobs.length === 0) {
        logger.info('No jobs to process', { userId, tenantId });
        return result;
      }

      // 2. Check plan limits
      const planLimit = await tenantService.checkPlanLimit(tenantId);
      const currentCount = planLimit.currentCount;
      const limit = planLimit.limit;
      const availableSlots = limit === null ? Infinity : limit - currentCount;

      logger.info('Plan limit check', {
        tenantId,
        currentCount,
        limit,
        availableSlots,
        jobsToAdd: jobs.length,
      });

      // 3. Determine which jobs can be saved and queued
      const jobsToQueue: CreateJobDto[] = [];
      const jobsToPending: CreateJobDto[] = [];

      if (availableSlots >= jobs.length) {
        // All jobs fit within limit
        jobsToQueue.push(...jobs);
      } else if (availableSlots > 0) {
        // Some jobs fit, some need to wait
        jobsToQueue.push(...jobs.slice(0, availableSlots));
        jobsToPending.push(...jobs.slice(availableSlots));
      } else {
        // No slots available, all go to pending
        jobsToPending.push(...jobs);
      }

      // 4. Save jobs that can be queued immediately
      if (jobsToQueue.length > 0) {
        try {
          // Save jobs one by one to get their IDs, or use createMany and then query by createdAt
          const savedJobs: { id: string; title: string; description: string }[] = [];
          
          for (const jobDto of jobsToQueue) {
            try {
              const savedJob = await jobRepository.create(jobDto, userId, tenantId);
              savedJobs.push({
                id: savedJob.id,
                title: savedJob.title,
                description: savedJob.description,
              });
            } catch (error) {
              const errorMsg = `Failed to save job ${jobDto.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              result.errors.push(errorMsg);
              logger.error('Failed to save job', { jobDto, userId, tenantId, error });
            }
          }

          result.saved = savedJobs.length;
          logger.info(`Saved ${savedJobs.length} jobs to database`, { userId, tenantId });

          // Add each saved job to queue
          for (const job of savedJobs) {
            try {
              // Validate state transition: new -> queued
              jobStateMachine.validateTransition('new', 'queued');

              // Update job status to 'queued'
              await jobRepository.updateStatus(job.id, 'queued', tenantId, userId);

              // Add to queue
              await addScoringJob({
                jobId: job.id,
                title: job.title,
                description: job.description,
                tenantId,
              });

              result.queued++;
              logger.debug('Job added to queue', { jobId: job.id, userId, tenantId });
            } catch (error) {
              const errorMsg = `Failed to add job ${job.id} to queue: ${error instanceof Error ? error.message : 'Unknown error'}`;
              result.errors.push(errorMsg);
              logger.error('Failed to add job to queue', {
                jobId: job.id,
                userId,
                tenantId,
                error,
              });
            }
          }
        } catch (error) {
          const errorMsg = `Failed to save jobs: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          logger.error('Error saving jobs', { error, userId, tenantId });
        }
      }

      // 5. Save jobs that exceed limit with pending_upgrade status
      if (jobsToPending.length > 0) {
        try {
          const pendingResult = await jobRepository.createManyWithStatus(
            jobsToPending,
            userId,
            tenantId,
            'pending_upgrade'
          );
          result.pendingUpgrade = pendingResult.count;
          logger.info(`Saved ${pendingResult.count} jobs with pending_upgrade status`, {
            userId,
            tenantId,
          });
        } catch (error) {
          const errorMsg = `Failed to save pending jobs: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          logger.error('Error saving pending jobs', { error, userId, tenantId });
        }
      }

      // 6. Emit WebSocket event
      webSocketService.emitJobsCreated(tenantId, result.fetched, {
        queued: result.queued,
        pendingUpgrade: result.pendingUpgrade,
      });

      logger.info('Completed job fetch and process', {
        userId,
        tenantId,
        result,
      });

      return result;
    } catch (error) {
      logger.error('Error in fetchAndProcessJobs', { error, userId, tenantId });
      result.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

export default new JobService();
