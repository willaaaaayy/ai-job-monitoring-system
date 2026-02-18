export interface AnalyticsOverview {
  totalJobs: number;
  averageScore: number | null;
  jobsByStatus: {
    new: number;
    queued: number;
    scored: number;
    archived: number;
  };
  jobsPerDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ScoreDistribution {
  ranges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}
