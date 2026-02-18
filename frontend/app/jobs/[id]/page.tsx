'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { ScoreBadge } from '@/components/jobs/ScoreBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useJob } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/auth.store';
import { ExternalLink, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { ScoreHistoryModal } from '@/components/jobs/ScoreHistoryModal';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const jobId = params.id as string;
  const { data: job, isLoading, error } = useJob(jobId);
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Job not found'}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <JobStatusBadge status={job.status} />
                  <ScoreBadge score={job.score} />
                </div>
              </div>
              {job.url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(job.url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Job
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.reason && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setIsReasonExpanded(!isReasonExpanded)}
                  className="gap-2 p-0 h-auto font-semibold"
                >
                  {isReasonExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Scoring Reason
                </Button>
                {isReasonExpanded && (
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm">{job.reason}</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <ScoreHistoryModal jobId={job.id} />
            </div>

            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(job.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
