import billingService from '../billing.service';
import tenantService from '../../tenant/tenant.service';
import tenantRepository from '../../tenant/tenant.repository';
import { stripe, getStripeWebhookSecret } from '../../../infrastructure/stripe';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('../../tenant/tenant.service');
jest.mock('../../tenant/tenant.repository');
jest.mock('../../../infrastructure/stripe');
jest.mock('../../../infrastructure/logger');

describe('BillingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for existing customer', async () => {
      const mockTenant = {
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'free',
        stripeCustomerId: 'cus_existing',
        stripeSubscriptionId: null,
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session_123',
        url: 'https://checkout.stripe.com/session_123',
      };

      (tenantService.getTenantById as jest.Mock).mockResolvedValue(mockTenant);
      (stripe?.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await billingService.createCheckoutSession('tenant1', {
        plan: 'pro',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe(mockSession.url);
      expect(stripe?.checkout.sessions.create).toHaveBeenCalled();
    });

    it('should create customer if not exists', async () => {
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

      const mockCustomer = { id: 'cus_new' };
      const mockSession = {
        id: 'session_123',
        url: 'https://checkout.stripe.com/session_123',
      };

      (tenantService.getTenantById as jest.Mock).mockResolvedValue(mockTenant);
      (stripe?.customers.create as jest.Mock).mockResolvedValue(mockCustomer);
      (stripe?.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (tenantRepository.update as jest.Mock).mockResolvedValue({
        ...mockTenant,
        stripeCustomerId: 'cus_new',
      });

      const result = await billingService.createCheckoutSession('tenant1', {
        plan: 'pro',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe(mockSession.url);
      expect(stripe?.customers.create).toHaveBeenCalled();
      expect(tenantRepository.update).toHaveBeenCalledWith('tenant1', {
        stripeCustomerId: 'cus_new',
      });
    });

    it('should throw error if tenant not found', async () => {
      (tenantService.getTenantById as jest.Mock).mockResolvedValue(null);

      await expect(
        billingService.createCheckoutSession('nonexistent', {
          plan: 'pro',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'session_123',
            subscription: 'sub_123',
            metadata: {
              tenantId: 'tenant1',
              plan: 'pro',
            },
          },
        },
      } as unknown as Stripe.Event;

      (tenantRepository.update as jest.Mock).mockResolvedValue({});
      (tenantService.processPendingJobsAfterUpgrade as jest.Mock).mockResolvedValue(5);

      await billingService.handleWebhook(mockEvent);

      expect(tenantRepository.update).toHaveBeenCalledWith('tenant1', {
        plan: 'pro',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'active',
      });
      expect(tenantService.processPendingJobsAfterUpgrade).toHaveBeenCalledWith('tenant1');
    });

    it('should handle customer.subscription.updated event', async () => {
      const mockTenant = {
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'pro',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
            metadata: {
              tenantId: 'tenant1',
            },
          },
        },
      } as unknown as Stripe.Event;

      (tenantRepository.findById as jest.Mock).mockResolvedValue(mockTenant);
      (tenantRepository.update as jest.Mock).mockResolvedValue(mockTenant);

      await billingService.handleWebhook(mockEvent);

      expect(tenantRepository.update).toHaveBeenCalledWith('tenant1', {
        subscriptionStatus: 'active',
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'valid_signature';

      (stripe?.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.completed',
        data: {},
      });

      const result = await billingService.verifyWebhookSignature(payload, signature);

      expect(result).toBeDefined();
      expect(stripe?.webhooks.constructEvent).toHaveBeenCalled();
    });

    it('should throw error for invalid signature', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'invalid_signature';

      (stripe?.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        billingService.verifyWebhookSignature(payload, signature)
      ).rejects.toThrow();
    });
  });
});
