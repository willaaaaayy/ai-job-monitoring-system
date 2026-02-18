import { ScoringHistory } from '@prisma/client';

export interface CreateScoringHistoryDto {
  jobId: string;
  score: number;
  reason: string;
}

export interface ScoringHistoryWithJob extends ScoringHistory {
  job: {
    id: string;
    title: string;
    status: string;
  };
}
