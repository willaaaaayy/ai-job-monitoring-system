'use client';

import { Badge } from '@/components/ui/badge';
import { TenantPlan } from '@/types/auth';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  plan: TenantPlan;
  className?: string;
}

const planColors: Record<TenantPlan, string> = {
  free: 'bg-gray-500 hover:bg-gray-500/80',
  pro: 'bg-blue-500 hover:bg-blue-500/80',
  enterprise: 'bg-purple-500 hover:bg-purple-500/80',
};

export function SubscriptionBadge({ plan, className }: SubscriptionBadgeProps) {
  return (
    <Badge className={cn(planColors[plan], 'capitalize', className)}>
      {plan}
    </Badge>
  );
}
