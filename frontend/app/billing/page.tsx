'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { SubscriptionCard } from '@/components/billing/SubscriptionCard';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant'],
    queryFn: async () => {
      // In a real app, you'd have a /tenants/me endpoint
      // For now, we'll need to get tenant info from user context or create an endpoint
      const response = await api.get('/tenants/plan-limit/check');
      // This is a placeholder - you'd need to adjust based on your actual API
      return {
        id: user?.tenantId || '',
        name: 'My Organization',
        plan: 'free' as const,
        subscriptionStatus: 'active' as const,
      };
    },
    enabled: !!user?.tenantId,
  });

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been successfully updated.',
      });
    }
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Checkout Canceled',
        description: 'Your checkout was canceled. No changes were made.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Billing & Subscription</h1>
        {tenant && (
          <SubscriptionCard
            plan={tenant.plan}
            subscriptionStatus={tenant.subscriptionStatus}
          />
        )}
      </div>
    </Layout>
  );
}
