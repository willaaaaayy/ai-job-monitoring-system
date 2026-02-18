import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { JobsResponse, Job } from '@/types/job';
import { toast } from 'sonner';

/**
 * Fetch all jobs for authenticated user with filters
 */
export function useJobs(
  skip?: number,
  take?: number,
  filters?: {
    status?: string | string[];
    minScore?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
) {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', skip, take, filters],
    queryFn: () => jobsApi.getAll(skip, take, filters),
    staleTime: 60000, // 60 seconds
    refetchInterval: 10000, // Optional: poll every 10 seconds
  });
}

/**
 * Search jobs by query string
 */
export function useSearchJobs(query: string, skip?: number, take?: number) {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', 'search', query, skip, take],
    queryFn: () => jobsApi.search(query, skip, take),
    enabled: !!query && query.trim().length > 0,
    staleTime: 60000,
  });
}

/**
 * Fetch single job by ID
 */
export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Mutation to trigger manual job fetch
 */
export function useFetchJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsApi.fetchJobs,
    onSuccess: () => {
      toast.success('Job fetch triggered successfully');
      // Invalidate jobs query to refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fetch jobs');
    },
  });
}
