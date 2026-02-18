import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { Layout } from '@/components/layout/Layout';

export default function AdminAnalyticsPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
}
