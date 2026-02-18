import analyticsService from '../analytics.service';
import prisma from '../../../infrastructure/prisma';

// Mock dependencies
jest.mock('../../../infrastructure/prisma', () => ({
  job: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
}));
jest.mock('../../../infrastructure/logger');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return overview metrics', async () => {
      (prisma.job.count as jest.Mock).mockResolvedValue(100);
      (prisma.job.aggregate as jest.Mock).mockResolvedValue({
        _avg: { score: 7.5 },
      });
      (prisma.job.groupBy as jest.Mock).mockResolvedValue([
        { status: 'new', _count: { id: 20 } },
        { status: 'queued', _count: { id: 30 } },
        { status: 'scored', _count: { id: 40 } },
        { status: 'archived', _count: { id: 10 } },
      ]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getOverview('tenant1');

      expect(result.totalJobs).toBe(100);
      expect(result.averageScore).toBe(7.5);
      expect(result.jobsByStatus.new).toBe(20);
      expect(result.jobsByStatus.queued).toBe(30);
      expect(result.jobsByStatus.scored).toBe(40);
      expect(result.jobsByStatus.archived).toBe(10);
      expect(result.jobsPerDay).toHaveLength(30);
    });

    it('should handle null average score', async () => {
      (prisma.job.count as jest.Mock).mockResolvedValue(10);
      (prisma.job.aggregate as jest.Mock).mockResolvedValue({
        _avg: { score: null },
      });
      (prisma.job.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getOverview('tenant1');

      expect(result.averageScore).toBeNull();
    });
  });

  describe('getScoreDistribution', () => {
    it('should return score distribution', async () => {
      const mockJobs = [
        { score: 2 }, // 0-3
        { score: 5 }, // 4-6
        { score: 5 }, // 4-6
        { score: 8 }, // 7-8
        { score: 9 }, // 9-10
        { score: 10 }, // 9-10
      ];

      (prisma.job.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const result = await analyticsService.getScoreDistribution('tenant1');

      expect(result.ranges).toHaveLength(4);
      expect(result.ranges[0].range).toBe('0-3');
      expect(result.ranges[0].count).toBe(1);
      expect(result.ranges[1].range).toBe('4-6');
      expect(result.ranges[1].count).toBe(2);
      expect(result.ranges[2].range).toBe('7-8');
      expect(result.ranges[2].count).toBe(1);
      expect(result.ranges[3].range).toBe('9-10');
      expect(result.ranges[3].count).toBe(2);
    });

    it('should calculate percentages correctly', async () => {
      const mockJobs = [
        { score: 5 }, // 4-6
        { score: 5 }, // 4-6
        { score: 8 }, // 7-8
      ];

      (prisma.job.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const result = await analyticsService.getScoreDistribution('tenant1');

      // 2 out of 3 jobs in 4-6 range = 67%
      const range46 = result.ranges.find((r) => r.range === '4-6');
      expect(range46?.percentage).toBe(67);
    });

    it('should handle empty results', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getScoreDistribution('tenant1');

      expect(result.ranges).toHaveLength(4);
      result.ranges.forEach((range) => {
        expect(range.count).toBe(0);
        expect(range.percentage).toBe(0);
      });
    });
  });
});
