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
    incr(key: string, cb: (error: Error | undefined, totalHits: number, resetTime: Date | undefined) => void) {
      (async () => {
        try {
          const client = redisClient.getClient();
          const hits = await client.incr(key);
          const expireTime = Math.ceil(config.rateLimitWindowMs / 1000);
          await client.expire(key, expireTime);
          const resetTime = new Date(Date.now() + config.rateLimitWindowMs);
          cb(undefined, hits, resetTime);
        } catch (error) {
          cb(error as Error, 0, undefined);
        }
      })();
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
