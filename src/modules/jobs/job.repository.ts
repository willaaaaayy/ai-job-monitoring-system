import prisma from '../../infrastructure/prisma';
import { Job, Prisma } from '@prisma/client';
import { CreateJobDto, JobStatus } from './job.types';

export class JobRepository {
  async create(data: CreateJobDto, userId: string, tenantId: string): Promise<Job> {
    return prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        status: 'new',
        userId,
        tenantId,
      },
    });
  }

  async createMany(data: CreateJobDto[], userId: string, tenantId: string): Promise<Prisma.BatchPayload> {
    return prisma.job.createMany({
      data: data.map((job) => ({
        title: job.title,
        description: job.description,
        url: job.url,
        status: 'new' as JobStatus,
        userId,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }

  async findById(id: string, tenantId: string, userId?: string): Promise<Job | null> {
    const where: { id: string; tenantId: string; userId?: string } = {
      id,
      tenantId,
    };
    if (userId) {
      where.userId = userId;
    }
    return prisma.job.findFirst({
      where,
    });
  }

  async findAll(
    tenantId: string,
    userId?: string,
    skip?: number,
    take?: number,
    filters?: {
      status?: JobStatus | JobStatus[];
      minScore?: number;
      maxScore?: number;
      startDate?: Date;
      endDate?: Date;
      searchQuery?: string;
    }
  ): Promise<Job[]> {
    const where: any = { tenantId };
    
    if (userId) {
      where.userId = userId;
    }

    // Status filter
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Score range filter
    if (filters?.minScore !== undefined || filters?.maxScore !== undefined) {
      where.score = {};
      if (filters.minScore !== undefined) {
        where.score.gte = filters.minScore;
      }
      if (filters.maxScore !== undefined) {
        where.score.lte = filters.maxScore;
      }
    }

    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Full-text search
    if (filters?.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
        { url: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    return prisma.job.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(
    tenantId: string,
    userId: string | undefined,
    query: string,
    skip?: number,
    take?: number
  ): Promise<Job[]> {
    const where: any = {
      tenantId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { url: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (userId) {
      where.userId = userId;
    }

    return prisma.job.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(
    tenantId: string,
    userId?: string,
    filters?: {
      status?: JobStatus | JobStatus[];
      minScore?: number;
      maxScore?: number;
      startDate?: Date;
      endDate?: Date;
      searchQuery?: string;
    }
  ): Promise<number> {
    const where: any = { tenantId };
    
    if (userId) {
      where.userId = userId;
    }

    // Apply same filters as findAll
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    if (filters?.minScore !== undefined || filters?.maxScore !== undefined) {
      where.score = {};
      if (filters.minScore !== undefined) {
        where.score.gte = filters.minScore;
      }
      if (filters.maxScore !== undefined) {
        where.score.lte = filters.maxScore;
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
        { url: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    return prisma.job.count({
      where,
    });
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    tenantId: string,
    userId?: string,
    score?: number,
    reason?: string
  ): Promise<Job> {
    const where: { id: string; tenantId: string; userId?: string } = {
      id,
      tenantId,
    };
    if (userId) {
      where.userId = userId;
    }
    return prisma.job.update({
      where,
      data: {
        status,
        score: score !== undefined ? score : undefined,
        reason: reason !== undefined ? reason : undefined,
      },
    });
  }

  async findByStatus(status: JobStatus, tenantId: string, userId?: string): Promise<Job[]> {
    const where: { status: JobStatus; tenantId: string; userId?: string } = {
      status,
      tenantId,
    };
    if (userId) {
      where.userId = userId;
    }
    return prisma.job.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find job by ID without userId check (for webhook processing)
   */
  async findByIdForWebhook(id: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: { id },
    });
  }

  /**
   * Update job status without userId check (for webhook processing)
   * Still requires tenantId for isolation
   */
  async updateStatusForWebhook(
    id: string,
    tenantId: string,
    status: JobStatus,
    score?: number,
    reason?: string
  ): Promise<Job> {
    return prisma.job.update({
      where: { id, tenantId },
      data: {
        status,
        score: score !== undefined ? score : undefined,
        reason: reason !== undefined ? reason : undefined,
      },
    });
  }

  /**
   * Create job with specific status (for pending_upgrade)
   */
  async createWithStatus(
    data: CreateJobDto,
    userId: string,
    tenantId: string,
    status: JobStatus
  ): Promise<Job> {
    return prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        status,
        userId,
        tenantId,
      },
    });
  }

  /**
   * Create many jobs with specific status
   */
  async createManyWithStatus(
    data: CreateJobDto[],
    userId: string,
    tenantId: string,
    status: JobStatus
  ): Promise<Prisma.BatchPayload> {
    return prisma.job.createMany({
      data: data.map((job) => ({
        title: job.title,
        description: job.description,
        url: job.url,
        status,
        userId,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Find all pending_upgrade jobs for a tenant
   */
  async findPendingUpgrade(tenantId: string): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        tenantId,
        status: 'pending_upgrade',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update pending_upgrade jobs to queued status
   */
  async updatePendingToQueued(tenantId: string, jobIds: string[]): Promise<Prisma.BatchPayload> {
    return prisma.job.updateMany({
      where: {
        id: { in: jobIds },
        tenantId,
        status: 'pending_upgrade',
      },
      data: {
        status: 'queued',
      },
    });
  }

  /**
   * Find job by unique URL for a tenant (for duplicate checking)
   */
  async findByUniqueUrl(tenantId: string, url: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: {
        tenantId_url: {
          tenantId,
          url,
        },
      },
    });
  }
}

export default new JobRepository();
