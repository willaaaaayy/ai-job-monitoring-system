import prisma from '../../infrastructure/prisma';
import { AnalyticsOverview, ScoreDistribution } from './analytics.types';
import logger from '../../infrastructure/logger';
import { AppError } from '../../middlewares/error.middleware';

export class AnalyticsService {
  async getOverview(tenantId: string): Promise<AnalyticsOverview> {
    try {
      // Get total jobs count
      const totalJobs = await prisma.job.count({
        where: { tenantId },
      });

      // Get average score
      const avgScoreResult = await prisma.job.aggregate({
        where: {
          tenantId,
          score: { not: null },
        },
        _avg: {
          score: true,
        },
      });
      const averageScore = avgScoreResult._avg.score;

      // Get jobs by status
      const statusCounts = await prisma.job.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: {
          id: true,
        },
      });

      const jobsByStatus = {
        new: 0,
        queued: 0,
        scored: 0,
        archived: 0,
      };

      statusCounts.forEach((item) => {
        const status = item.status as keyof typeof jobsByStatus;
        if (status in jobsByStatus) {
          jobsByStatus[status] = item._count.id;
        }
      });

      // Get jobs per day for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const jobs = await prisma.job.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Group by day
      const jobsPerDayMap = new Map<string, number>();
      jobs.forEach((job) => {
        const date = new Date(job.createdAt).toISOString().split('T')[0];
        jobsPerDayMap.set(date, (jobsPerDayMap.get(date) || 0) + 1);
      });

      // Fill in missing days with 0
      const jobsPerDay: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        jobsPerDay.push({
          date: dateStr,
          count: jobsPerDayMap.get(dateStr) || 0,
        });
      }

      return {
        totalJobs,
        averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null,
        jobsByStatus,
        jobsPerDay,
      };
    } catch (error) {
      logger.error('Error fetching analytics overview', { error, tenantId });
      throw new AppError('Failed to fetch analytics overview', 500);
    }
  }

  async getScoreDistribution(tenantId: string): Promise<ScoreDistribution> {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          tenantId,
          score: { not: null },
        },
        select: {
          score: true,
        },
      });

      const ranges = [
        { range: '0-3', min: 0, max: 3 },
        { range: '4-6', min: 4, max: 6 },
        { range: '7-8', min: 7, max: 8 },
        { range: '9-10', min: 9, max: 10 },
      ];

      const totalScored = jobs.length;
      const distribution = ranges.map((range) => {
        const count = jobs.filter(
          (job) => job.score !== null && job.score >= range.min && job.score <= range.max
        ).length;
        return {
          range: range.range,
          count,
          percentage: totalScored > 0 ? Math.round((count / totalScored) * 100) : 0,
        };
      });

      return {
        ranges: distribution,
      };
    } catch (error) {
      logger.error('Error fetching score distribution', { error, tenantId });
      throw new AppError('Failed to fetch score distribution', 500);
    }
  }
}

export default new AnalyticsService();
