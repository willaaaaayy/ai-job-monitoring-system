import { Job } from '@prisma/client';

export type JobStatus = 'new' | 'queued' | 'scored' | 'archived' | 'pending_upgrade';

export interface CreateJobDto {
  title: string;
  description: string;
  url: string;
}

export interface UpdateJobScoreDto {
  score: number;
  reason: string;
}

export interface JobWithRelations extends Job {
  // Future: Add relations here if needed
}

export interface FetchJobsResponse {
  jobs: Job[];
  total: number;
}

export interface JobFilters {
  status?: JobStatus | JobStatus[];
  minScore?: number;
  maxScore?: number;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}
