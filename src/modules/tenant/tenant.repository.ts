import prisma from '../../infrastructure/prisma';
import { Tenant } from '@prisma/client';
import { CreateTenantDto, UpdateTenantDto } from './tenant.types';

export class TenantRepository {
  async create(data: CreateTenantDto): Promise<Tenant> {
    return prisma.tenant.create({
      data: {
        name: data.name,
        plan: data.plan,
      },
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<Tenant | null> {
    return prisma.tenant.findFirst({
      where: { name },
    });
  }

  async findAll(skip?: number, take?: number): Promise<Tenant[]> {
    return prisma.tenant.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            users: true,
            jobs: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        plan: data.plan,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        subscriptionStatus: data.subscriptionStatus,
      },
    });
  }

  async countJobs(tenantId: string): Promise<number> {
    return prisma.job.count({
      where: { tenantId },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Find all pending_upgrade jobs for a tenant
   */
  async findPendingUpgradeJobs(tenantId: string) {
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
}

export default new TenantRepository();
