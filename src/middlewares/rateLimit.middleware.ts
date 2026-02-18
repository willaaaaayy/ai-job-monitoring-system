import rateLimit from 'express-rate-limit';
import config from '../infrastructure/config';
import redisClient from '../infrastructure/redis';

/**
 * Rate limiting middleware using Redis store
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health and metrics endpoints
    // Also skip for /jobs/fetch as it's a manual trigger endpoint (has its own rate limiter)
    const path = req.path || req.url?.split('?')[0] || '';
    return path === '/health' || path === '/metrics' || path === '/jobs/fetch' || path.endsWith('/jobs/fetch');
  },
  store: {
    async incr(key: string, cb: (err?: Error | null, hits?: number) => void) {
      try {
        const client = redisClient.getClient();
        const hits = await client.incr(key);
        await client.expire(key, Math.ceil(config.rateLimitWindowMs / 1000));
        cb(null, hits);
      } catch (error) {
        cb(error as Error);
      }
    },
    async decrement(key: string) {
      try {
        const client = redisClient.getClient();
        await client.decr(key);
      } catch (error) {
        // Ignore errors
      }
    },
    async resetKey(key: string) {
      try {
        const client = redisClient.getClient();
        await client.del(key);
      } catch (error) {
        // Ignore errors
      }
    },
  },
  message: 'Too many requests from this IP, please try again later.',
});
