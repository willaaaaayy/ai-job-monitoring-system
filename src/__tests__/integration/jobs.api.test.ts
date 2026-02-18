import request from 'supertest';
import app from '../../app';
import prisma from '../../infrastructure/prisma';
import jwtService from '../../infrastructure/jwt';

describe('Jobs API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let tenantId: string;

  beforeAll(async () => {
    // Create test user and tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        plan: 'free',
      },
    });

    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password',
        tenantId: tenant.id,
        role: 'user',
      },
    });

    userId = user.id;

    authToken = jwtService.generateToken({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: 'user',
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.job.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  describe('GET /jobs', () => {
    it('should return jobs for authenticated user', async () => {
      // Create test job
      await prisma.job.create({
        data: {
          title: 'Test Job',
          description: 'Test Description',
          url: 'https://example.com',
          status: 'new',
          userId,
          tenantId,
        },
      });

      const response = await request(app)
        .get('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.jobs).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/jobs').expect(401);
    });
  });

  describe('GET /jobs/search', () => {
    it('should search jobs by query', async () => {
      await prisma.job.create({
        data: {
          title: 'Senior Developer Position',
          description: 'Looking for a senior developer',
          url: 'https://example.com/job1',
          status: 'scored',
          score: 8,
          userId,
          tenantId,
        },
      });

      const response = await request(app)
        .get('/jobs/search?q=developer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.jobs).toBeInstanceOf(Array);
      expect(response.body.jobs.length).toBeGreaterThan(0);
    });
  });
});
