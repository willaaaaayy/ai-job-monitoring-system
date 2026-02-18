import prisma from '../../infrastructure/prisma';
import { User } from '@prisma/client';
import { CreateUserDto, UserWithoutPassword } from './user.types';

export class UserRepository {
  async create(data: CreateUserDto & { tenantId: string; role?: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password, // Password should be hashed before calling this
        tenantId: data.tenantId,
        role: data.role || 'user',
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: { tenantId },
      include: {
        tenant: true,
      },
    });
  }

  async findByIdWithoutPassword(id: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async update(id: string, data: Partial<CreateUserDto & { role?: string; tenantId?: string }>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        password: data.password,
        role: data.role,
        tenantId: data.tenantId,
      },
    });
  }
}

export default new UserRepository();
