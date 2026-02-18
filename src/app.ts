import express, { Express, Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import jobRoutes from './modules/jobs/job.routes';
import authRoutes from './modules/auth/auth.routes';
import tenantRoutes from './modules/tenant/tenant.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import billingRoutes from './modules/billing/billing.routes';
import scoringController from './modules/scoring/scoring.controller';
import metricsController from './modules/metrics/metrics.controller';
import { errorHandler } from './middlewares/error.middleware';
import { correlationIdMiddleware } from './middlewares/correlationId.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { rateLimitMiddleware } from './middlewares/rateLimit.middleware';
import { csrfProtection, attachCsrfToken } from './middlewares/csrf.middleware';
import { setupSwagger } from './docs/swagger';
import { httpRequestDuration, httpRequestTotal } from './infrastructure/metrics';
import logger from './infrastructure/logger';
import redisClient from './infrastructure/redis';
import prisma from './infrastructure/prisma';
import { getQueueMetrics } from './modules/queue/scoring.queue';
import config from './infrastructure/config';

const app: Express = express();

// Sentry request handler must be first
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use((req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
  
  // In production, only allow specific origins
  if (config.nodeEnv === 'production') {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Don't allow wildcard in production
  } else {
    // In development, allow any origin if '*' is specified or origin is in allowed list
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Raw body parser for Stripe webhook (must be BEFORE express.json())
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correlation ID middleware (must be first)
app.use(correlationIdMiddleware);

// Request logger middleware
app.use(requestLoggerMiddleware);

// Attach CSRF token to all responses
app.use(attachCsrfToken);

// CSRF protection (after attaching token)
app.use(csrfProtection);

// Rate limiting middleware
app.use(rateLimitMiddleware);

// Metrics middleware - track request duration and count
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const [dbHealthy, redisHealthy, queueHealthy] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      redisClient.healthCheck(),
      getQueueMetrics().then(() => true).catch(() => false),
    ]);

    const healthy = dbHealthy && redisHealthy && queueHealthy;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'ok' : 'failed',
        redis: redisHealthy ? 'ok' : 'failed',
        queue: queueHealthy ? 'ok' : 'failed',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 */
app.get('/metrics', metricsController.getMetrics.bind(metricsController));

// API Routes
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/tenants', tenantRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/billing', billingRoutes);

// Webhook endpoint for n8n scoring results (no auth required)
/**
 * @swagger
 * /webhooks/scoring:
 *   post:
 *     summary: Receive scoring results from n8n
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - score
 *               - reason
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scoring result processed successfully
 *       400:
 *         description: Invalid payload or state transition
 */
app.post('/webhooks/scoring', scoringController.receiveScoringResult.bind(scoringController));

// Swagger documentation
setupSwagger(app);

// Sentry error handler must be before errorHandler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
