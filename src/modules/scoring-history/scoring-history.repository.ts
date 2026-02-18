import prisma from '../../infrastructure/prisma';
import { ScoringHistory } from '@prisma/client';
import { CreateScoringHistoryDto } from './scoring-history.types';

export class ScoringHistoryRepository {
  async create(data: CreateScoringHistoryDto): Promise<ScoringHistory> {
    return prisma.scoringHistory.create({
      data: {
        jobId: data.jobId,
        score: data.score,
        reason: data.reason,
      },
    });
  }

  async findByJobId(jobId: string, tenantId: string): Promise<ScoringHistory[]> {
    return prisma.scoringHistory.findMany({
      where: {
        jobId,
        job: {
          tenantId, // Ensure tenant isolation
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async findById(id: string, tenantId: string): Promise<ScoringHistory | null> {
    return prisma.scoringHistory.findFirst({
      where: {
        id,
        job: {
          tenantId, // Ensure tenant isolation
        },
      },
    });
  }

  async countByJobId(jobId: string, tenantId: string): Promise<number> {
    return prisma.scoringHistory.count({
      where: {
        jobId,
        job: {
          tenantId, // Ensure tenant isolation
        },
      },
    });
  }
}

export default new ScoringHistoryRepository();
