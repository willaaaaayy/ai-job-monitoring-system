'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { JobTable } from '@/components/jobs/JobTable';
import { JobFilters, JobStatus } from '@/components/jobs/JobFilters';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { useJobs, useFetchJobs } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/auth.store';
import { RefreshCw } from 'lucide-react';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { checkAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const fetchJobsMutation = useFetchJobs();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [minScore, setMinScore] = useState<number | null>(null);
  const [maxScore, setMaxScore] = useState<number | null>(null);
  const [status, setStatus] = useState<JobStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate skip/take for pagination
  const skip = (currentPage - 1) * PAGE_SIZE;
  const take = PAGE_SIZE;

  // Build filters object
  const filters = useMemo(() => {
    const f: {
      status?: string;
      minScore?: number;
      maxScore?: number;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {};

    if (status !== 'all') {
      f.status = status;
    }
    if (minScore !== null) {
      f.minScore = minScore;
    }
    if (maxScore !== null) {
      f.maxScore = maxScore;
    }
    if (startDate) {
      f.startDate = startDate;
    }
    if (endDate) {
      f.endDate = endDate;
    }
    if (searchQuery.trim()) {
      f.search = searchQuery.trim();
    }

    return Object.keys(f).length > 0 ? f : undefined;
  }, [status, minScore, maxScore, startDate, endDate, searchQuery]);

  const { data, isLoading, error, refetch } = useJobs(skip, take, filters);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, minScore, maxScore, startDate, endDate, searchQuery]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleClearFilters = () => {
    setMinScore(null);
    setMaxScore(null);
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // WebSocket integration - only connect if authenticated
  useEffect(() => {
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      return;
    }

    try {
      const socket = connectWebSocket();
      
      if (!socket) {
        return;
      }

      socket.on('job_updated', (data: { jobId: string; status: string; score: number | null; updatedAt: string }) => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
        toast.success('Job updated', {
          description: `Job status changed to ${data.status}`,
        });
      });

      socket.on('job_scored', (data: { jobId: string; score: number; reason: string; status: string }) => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['job-history', data.jobId] });
        toast.success('Job scored', {
          description: `Job received a score of ${data.score}`,
        });
      });

      return () => {
        socket.off('job_updated');
        socket.off('job_scored');
        disconnectWebSocket();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [queryClient]);

  const handleFetchJobs = async () => {
    await fetchJobsMutation.mutateAsync();
    // Refetch after a short delay to allow backend to process
    setTimeout(() => {
      refetch();
    }, 2000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage your job listings</p>
          </div>
          <Button
            onClick={handleFetchJobs}
            disabled={fetchJobsMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${fetchJobsMutation.isPending ? 'animate-spin' : ''}`}
            />
            Fetch New Jobs
          </Button>
        </div>

        <JobFilters
          minScore={minScore}
          maxScore={maxScore}
          status={status}
          startDate={startDate}
          endDate={endDate}
          searchQuery={searchQuery}
          onMinScoreChange={setMinScore}
          onMaxScoreChange={setMaxScore}
          onStatusChange={setStatus}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error loading jobs: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        <JobTable jobs={data?.jobs || []} isLoading={isLoading} />

        {data && data.total > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            total={data.total}
          />
        )}
      </div>
    </Layout>
  );
}
