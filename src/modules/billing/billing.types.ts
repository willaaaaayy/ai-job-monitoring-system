import { z } from 'zod';

export type TenantPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export const createCheckoutSessionSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutSessionDto = z.infer<typeof createCheckoutSessionSchema>;

export interface PlanPrice {
  plan: TenantPlan;
  priceId: string;
  amount: number;
  currency: string;
}

// Stripe price IDs (should be configured via environment variables)
export const PLAN_PRICES: Record<TenantPlan, PlanPrice> = {
  free: {
    plan: 'free',
    priceId: '', // Free plan has no price
    amount: 0,
    currency: 'usd',
  },
  pro: {
    plan: 'pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO || '',
    amount: 2900, // $29.00
    currency: 'usd',
  },
  enterprise: {
    plan: 'enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    amount: 9900, // $99.00
    currency: 'usd',
  },
};
