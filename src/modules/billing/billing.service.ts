import { stripe, getStripeWebhookSecret } from '../../infrastructure/stripe';
import tenantService from '../tenant/tenant.service';
import tenantRepository from '../tenant/tenant.repository';
import { CreateCheckoutSessionDto, PLAN_PRICES } from './billing.types';
import logger from '../../infrastructure/logger';
import { AppError } from '../../middlewares/error.middleware';
import Stripe from 'stripe';
import webSocketService from '../websocket/websocket.service';

export class BillingService {
  async createCheckoutSession(tenantId: string, data: CreateCheckoutSessionDto): Promise<{ url: string }> {
    if (!stripe) {
      throw new AppError('Stripe is not configured', 500);
    }

    try {
      const tenant = await tenantService.getTenantById(tenantId);
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      const planPrice = PLAN_PRICES[data.plan];
      if (!planPrice.priceId) {
        throw new AppError(`Price ID not configured for plan: ${data.plan}`, 500);
      }

      // Get or create Stripe customer
      let customerId = tenant.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: {
            tenantId,
          },
        });
        customerId = customer.id;
        await tenantRepository.update(tenantId, {
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: planPrice.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          tenantId,
          plan: data.plan,
        },
      });

      logger.info('Checkout session created', { tenantId, sessionId: session.id, plan: data.plan });

      return { url: session.url || '' };
    } catch (error) {
      logger.error('Error creating checkout session', { error, tenantId });
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const tenantId = session.metadata?.tenantId;
          const plan = session.metadata?.plan as string;

          if (!tenantId || !plan) {
            logger.error('Missing metadata in checkout session', { sessionId: session.id });
            return;
          }

          await tenantRepository.update(tenantId, {
            plan: plan as 'free' | 'pro' | 'enterprise',
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
          });

          logger.info('Subscription activated', { tenantId, plan, subscriptionId: session.subscription });
          
          // Process pending jobs after plan upgrade
          try {
            const processedCount = await tenantService.processPendingJobsAfterUpgrade(tenantId);
            logger.info('Processed pending jobs after upgrade', { tenantId, processedCount });
          } catch (error) {
            logger.error('Failed to process pending jobs after upgrade', { tenantId, error });
            // Don't throw - subscription is still activated
          }
          
          // Emit WebSocket event for UI update
          webSocketService.emitJobUpdated(tenantId, {} as any); // Trigger UI refresh
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const tenant = await tenantRepository.findById(subscription.metadata?.tenantId || '');
          
          if (!tenant) {
            logger.error('Tenant not found for subscription', { subscriptionId: subscription.id });
            return;
          }

          await tenantRepository.update(tenant.id, {
            subscriptionStatus: subscription.status === 'active' ? 'active' : 'canceled',
          });

          logger.info('Subscription updated', { tenantId: tenant.id, status: subscription.status });
          break;
        }

        default:
          logger.debug('Unhandled Stripe event', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling Stripe webhook', { error, eventType: event.type });
      throw error;
    }
  }

  async verifyWebhookSignature(payload: Buffer, signature: string): Promise<Stripe.Event> {
    if (!stripe) {
      throw new AppError('Stripe is not configured', 500);
    }

    try {
      const webhookSecret = getStripeWebhookSecret();
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw new AppError('Invalid webhook signature', 400);
    }
  }
}

export default new BillingService();
