import scoringHistoryRepository from './scoring-history.repository';
import { CreateScoringHistoryDto } from './scoring-history.types';
import { ScoringHistory } from '@prisma/client';
import logger from '../../infrastructure/logger';
import { AppError } from '../../middlewares/error.middleware';

export class ScoringHistoryService {
  async createHistory(data: CreateScoringHistoryDto): Promise<ScoringHistory> {
    try {
      const history = await scoringHistoryRepository.create(data);
      logger.info('Scoring history created', { jobId: data.jobId, score: data.score });
      return history;
    } catch (error) {
      logger.error('Error creating scoring history', { error, jobId: data.jobId });
      throw new AppError('Failed to create scoring history', 500);
    }
  }

  async getHistoryByJobId(jobId: string, tenantId: string): Promise<ScoringHistory[]> {
    try {
      return await scoringHistoryRepository.findByJobId(jobId, tenantId);
    } catch (error) {
      logger.error('Error fetching scoring history', { error, jobId, tenantId });
      throw new AppError('Failed to fetch scoring history', 500);
    }
  }
}

export default new ScoringHistoryService();
