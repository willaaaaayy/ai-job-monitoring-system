import jobService from '../job.service';
import jobRepository from '../job.repository';
import tenantService from '../../tenant/tenant.service';
import { JobStatus } from '../job.types';

// Mock dependencies
jest.mock('../job.repository');
jest.mock('../../tenant/tenant.service');
jest.mock('../../infrastructure/logger');

describe('JobService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllJobs', () => {
    it('should fetch jobs with filters', async () => {
      const mockJobs = [
        {
          id: '1',
          title: 'Test Job',
          description: 'Test Description',
          url: 'https://example.com',
          status: 'scored' as JobStatus,
          score: 8,
          tenantId: 'tenant1',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (jobRepository.findAll as jest.Mock).mockResolvedValue(mockJobs);
      (jobRepository.count as jest.Mock).mockResolvedValue(1);

      const result = await jobService.getAllJobs('tenant1', 'user1', 0, 10, {
        status: 'scored',
        minScore: 7,
      });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.total).toBe(1);
      expect(jobRepository.findAll).toHaveBeenCalledWith(
        'tenant1',
        'user1',
        0,
        10,
        expect.objectContaining({
          status: 'scored',
          minScore: 7,
        })
      );
    });
  });

  describe('searchJobs', () => {
    it('should search jobs by query', async () => {
      const mockJobs = [
        {
          id: '1',
          title: 'Senior Developer',
          description: 'Looking for a senior developer',
          url: 'https://example.com/job1',
          status: 'scored' as JobStatus,
          score: 8,
          tenantId: 'tenant1',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (jobRepository.search as jest.Mock).mockResolvedValue(mockJobs);
      (jobRepository.count as jest.Mock).mockResolvedValue(1);

      const result = await jobService.searchJobs('tenant1', 'user1', 'developer', 0, 10);

      expect(result.jobs).toEqual(mockJobs);
      expect(result.total).toBe(1);
      expect(jobRepository.search).toHaveBeenCalledWith('tenant1', 'user1', 'developer', 0, 10);
    });
  });
});
