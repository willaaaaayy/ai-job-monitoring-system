import tenantService from '../tenant.service';
import tenantRepository from '../tenant.repository';
import { PLAN_LIMITS } from '../tenant.types';

// Mock dependencies
jest.mock('../tenant.repository');
jest.mock('../../infrastructure/logger');

describe('TenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPlanLimit', () => {
    it('should return allowed=true when under limit', async () => {
      const mockTenant = {
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tenantRepository.findById as jest.Mock).mockResolvedValue(mockTenant);
      (tenantRepository.countJobs as jest.Mock).mockResolvedValue(30); // Under free limit (50)

      const result = await tenantService.checkPlanLimit('tenant1');

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(30);
      expect(result.limit).toBe(PLAN_LIMITS.free.maxJobs);
    });

    it('should return allowed=false when at limit', async () => {
      const mockTenant = {
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tenantRepository.findById as jest.Mock).mockResolvedValue(mockTenant);
      (tenantRepository.countJobs as jest.Mock).mockResolvedValue(50); // At free limit

      const result = await tenantService.checkPlanLimit('tenant1');

      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(50);
      expect(result.limit).toBe(PLAN_LIMITS.free.maxJobs);
    });

    it('should return allowed=true for enterprise plan (unlimited)', async () => {
      const mockTenant = {
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'enterprise',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tenantRepository.findById as jest.Mock).mockResolvedValue(mockTenant);
      (tenantRepository.countJobs as jest.Mock).mockResolvedValue(10000);

      const result = await tenantService.checkPlanLimit('tenant1');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(null); // Unlimited
    });

    it('should throw error if tenant not found', async () => {
      (tenantRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(tenantService.checkPlanLimit('nonexistent')).rejects.toThrow();
    });
  });

  describe('processPendingJobsAfterUpgrade', () => {
    it('should process pending jobs after upgrade', async () => {
      const mockPendingJobs = [
        {
          id: 'job1',
          title: 'Job 1',
          description: 'Description 1',
          url: 'https://example.com/job1',
          status: 'pending_upgrade',
          score: null,
          reason: null,
          userId: 'user1',
          tenantId: 'tenant1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'job2',
          title: 'Job 2',
          description: 'Description 2',
          url: 'https://example.com/job2',
          status: 'pending_upgrade',
          score: null,
          reason: null,
          userId: 'user1',
          tenantId: 'tenant1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (tenantRepository.findPendingUpgradeJobs as jest.Mock).mockResolvedValue(mockPendingJobs);

      // Mock dynamic imports
      const mockAddScoringJob = jest.fn().mockResolvedValue(undefined);
      const mockJobRepository = {
        updateStatusForWebhook: jest.fn().mockResolvedValue({}),
      };
      const mockJobStateMachine = {
        validateTransition: jest.fn(),
      };

      jest.mock('../../queue/scoring.queue', () => ({
        addScoringJob: mockAddScoringJob,
      }));
      jest.mock('../../jobs/job.repository', () => ({
        default: mockJobRepository,
      }));
      jest.mock('../../../stateMachine/jobStateMachine', () => ({
        default: mockJobStateMachine,
      }));

      const result = await tenantService.processPendingJobsAfterUpgrade('tenant1');

      expect(result).toBeGreaterThan(0);
      expect(tenantRepository.findPendingUpgradeJobs).toHaveBeenCalledWith('tenant1');
    });

    it('should return 0 if no pending jobs', async () => {
      (tenantRepository.findPendingUpgradeJobs as jest.Mock).mockResolvedValue([]);

      const result = await tenantService.processPendingJobsAfterUpgrade('tenant1');

      expect(result).toBe(0);
    });
  });
});
