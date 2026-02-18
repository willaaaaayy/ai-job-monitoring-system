export type JobStatus = 'new' | 'queued' | 'scored' | 'archived';

export interface Job {
  id: string;
  title: string;
  description: string;
  url: string;
  score: number | null;
  reason: string | null;
  status: JobStatus;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  skip: number;
  take: number;
}

export interface ScoringHistory {
  id: string;
  jobId: string;
  score: number;
  reason: string;
  createdAt: string;
}
