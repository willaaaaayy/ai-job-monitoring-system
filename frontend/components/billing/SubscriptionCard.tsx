'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { billingApi } from '@/lib/api';
import { TenantPlan, SubscriptionStatus } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SubscriptionCardProps {
  plan: TenantPlan;
  subscriptionStatus: SubscriptionStatus | null;
  onUpgrade?: () => void;
}

const PLAN_FEATURES: Record<TenantPlan, string[]> = {
  free: ['Up to 50 jobs', 'Basic scoring', 'Email support'],
  pro: ['Up to 1,000 jobs', 'Advanced scoring', 'Priority support', 'Analytics dashboard'],
  enterprise: ['Unlimited jobs', 'Custom scoring', 'Dedicated support', 'Full analytics', 'Custom integrations'],
};

const PLAN_PRICES: Record<TenantPlan, string> = {
  free: 'Free',
  pro: '$29/month',
  enterprise: '$99/month',
};

export function SubscriptionCard({ plan, subscriptionStatus, onUpgrade }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (targetPlan: 'pro' | 'enterprise') => {
    setLoading(true);
    try {
      const { data } = await billingApi.createCheckoutSession({
        plan: targetPlan,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Failed to create checkout session',
        description: error.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl capitalize">{plan} Plan</CardTitle>
            <CardDescription>Current subscription plan</CardDescription>
          </div>
          <Badge variant={plan === 'enterprise' ? 'default' : plan === 'pro' ? 'secondary' : 'outline'}>
            {subscriptionStatus || 'active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">{PLAN_PRICES[plan]}</div>
        <ul className="space-y-2">
          {PLAN_FEATURES[plan].map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        {plan !== 'enterprise' && (
          <div className="pt-4 space-y-2">
            {plan === 'free' && (
              <>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upgrade to Pro'
                  )}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={loading}
                >
                  Upgrade to Enterprise
                </Button>
              </>
            )}
            {plan === 'pro' && (
              <Button
                className="w-full"
                onClick={() => handleUpgrade('enterprise')}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upgrade to Enterprise'
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
