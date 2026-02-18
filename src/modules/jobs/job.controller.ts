import { Request, Response, NextFunction } from 'express';
import jobService from './job.service';
import logger from '../../infrastructure/logger';
import { invalidateUserCache } from '../../middlewares/cache.middleware';

export class JobController {
  async fetchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!; // Auth middleware ensures this exists
      const tenantId = req.tenantId!;

      // Execute real job fetch and processing
      const result = await jobService.fetchAndProcessJobs(userId, tenantId);

      // Invalidate cache
      invalidateUserCache(userId);

      // Build response message
      let message = `Fetched ${result.fetched} jobs. `;
      if (result.queued > 0) {
        message += `${result.queued} queued for scoring. `;
      }
      if (result.pendingUpgrade > 0) {
        message += `${result.pendingUpgrade} saved but require plan upgrade to process. `;
      }
      if (result.errors.length > 0) {
        message += `${result.errors.length} errors occurred.`;
      }

      res.status(200).json({
        success: true,
        message: message.trim(),
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!; // Auth middleware ensures this exists
      const userId = req.role === 'admin' ? undefined : req.userId; // Admin sees all tenant jobs, user sees own
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;

      // Extract filters from query parameters
      const filters = {
        status: req.query.status as string | string[] | undefined,
        minScore: req.query.minScore ? parseInt(req.query.minScore as string, 10) : undefined,
        maxScore: req.query.maxScore ? parseInt(req.query.maxScore as string, 10) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        searchQuery: req.query.search as string | undefined,
      };

      const result = await jobService.getAllJobs(tenantId, userId, skip, take, filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const userId = req.role === 'admin' ? undefined : req.userId;
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;

      const result = await jobService.searchJobs(tenantId, userId, query.trim(), skip, take);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!; // Auth middleware ensures this exists
      const userId = req.role === 'admin' ? undefined : req.userId; // Admin can access any tenant job
      const { id } = req.params;
      const job = await jobService.getJobById(id, tenantId, userId);

      res.status(200).json(job);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
}

export default new JobController();
