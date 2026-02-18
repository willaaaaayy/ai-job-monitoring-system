export interface ScoringJobData {
  jobId: string;
  title: string;
  description: string;
  tenantId: string;
}

export interface ScoringJobResult {
  success: boolean;
  jobId: string;
  error?: string;
}
