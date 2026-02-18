import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import redisClient from '../infrastructure/redis';
import logger from '../infrastructure/logger';

/**
 * User-based rate limiting middleware
 * Uses userId instead of IP address for more accurate limiting
 */
export const userRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req: Request): Promise<number> => {
    // Different limits for different roles
    const role = req.role;
    if (role === 'admin') {
      return 500; // Admins get higher limit
    }
    return 100; // Regular users
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request): boolean => {
    // Skip rate limiting for health and metrics endpoints
    const path = req.path || req.url?.split('?')[0] || '';
    return path === '/health' || path === '/metrics';
  },
  keyGenerator: (req: Request): string => {
    // Use userId for rate limiting instead of IP
    const userId = req.userId || 'anonymous';
    const role = req.role || 'user';
    return `rate_limit:user:${userId}:${role}`;
  },
    store: {
      incr(key: string, cb: IncrementCallback): void {
        (async () => {
          try {
            const client = redisClient.getClient();
            const hits: number = await client.incr(key);
            await client.expire(key, 15 * 60); // 15 minutes
            const resetTime = new Date(Date.now() + 15 * 60 * 1000);
            cb(undefined, hits, resetTime);
          } catch (error) {
            logger.error('User rate limit store error', { error, key });
            cb(error as Error);
          }
        })();
      },
    async decrement(key: string) {
      try {
        const client = redisClient.getClient();
        await client.decr(key);
      } catch (error) {
        logger.error('User rate limit decrement error', { error, key });
      }
    },
    async resetKey(key: string) {
      try {
        const client = redisClient.getClient();
        await client.del(key);
      } catch (error) {
        logger.error('User rate limit reset error', { error, key });
      }
    },
  },
  message: 'Too many requests from this user, please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn('User rate limit exceeded', {
      userId: req.userId,
      role: req.role,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this user, please try again later.',
    });
  },
});

/**
 * Role-based rate limiting
 * Different limits for admin vs regular users
 */
export const roleBasedRateLimit = (adminLimit: number, userLimit: number) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: async (req: Request): Promise<number> => {
      return req.role === 'admin' ? adminLimit : userLimit;
    },
    keyGenerator: (req: Request): string => {
      const userId = req.userId || 'anonymous';
      const role = req.role || 'user';
      return `rate_limit:role:${role}:${userId}`;
    },
    store: {
      incr(key: string, cb: IncrementCallback): void {
        (async () => {
          try {
            const client = redisClient.getClient();
            const hits: number = await client.incr(key);
            await client.expire(key, 15 * 60);
            const resetTime = new Date(Date.now() + 15 * 60 * 1000);
            cb(undefined, hits, resetTime);
          } catch (error) {
            cb(error as Error);
          }
        })();
      },
      async decrement(key: string) {
        try {
          const client = redisClient.getClient();
          await client.decr(key);
        } catch (error) {
          // Ignore
        }
      },
      async resetKey(key: string) {
        try {
          const client = redisClient.getClient();
          await client.del(key);
        } catch (error) {
          // Ignore
        }
      },
    },
    message: 'Rate limit exceeded for your role',
  });
};
