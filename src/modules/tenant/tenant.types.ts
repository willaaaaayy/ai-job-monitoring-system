import { z } from 'zod';

export type TenantPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  subscriptionStatus: z.enum(['active', 'canceled', 'past_due', 'trialing']).optional(),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;

export interface PlanLimits {
  maxJobs: number | null; // null means unlimited
}

export const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  free: { maxJobs: 50 },
  pro: { maxJobs: 1000 },
  enterprise: { maxJobs: null }, // unlimited
};
