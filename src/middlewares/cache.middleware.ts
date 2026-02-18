import { Request, Response, NextFunction } from 'express';
import redisClient from '../infrastructure/redis';
import logger from '../infrastructure/logger';

const CACHE_TTL = 60; // 60 seconds

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  const userId = req.userId;
  const tenantId = req.tenantId;
  if (!userId || !tenantId) {
    next();
    return;
  }

  try {
    const skip = req.query.skip || '0';
    const take = req.query.take || '10';
    const cacheKey = `jobs:${tenantId}:${userId}:${skip}:${take}`;

    const client = redisClient.getClient();
    const cached = await client.get(cacheKey);

    if (cached) {
      logger.debug('Cache hit', { cacheKey, correlationId: req.correlationId });
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Store original json function
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      // Cache the response
      client
        .setex(cacheKey, CACHE_TTL, JSON.stringify(body))
        .catch((error) => {
          logger.error('Failed to cache response', { error, cacheKey });
        });
      logger.debug('Cache miss', { cacheKey, correlationId: req.correlationId });
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  } catch (error) {
    logger.error('Cache middleware error', { error });
    next();
  }
};

/**
 * Invalidate cache for a user
 */
export const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    const client = redisClient.getClient();
    const keys = await client.keys(`jobs:${userId}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
      logger.debug('Cache invalidated', { userId, keysCount: keys.length });
    }
  } catch (error) {
    logger.error('Failed to invalidate cache', { error, userId });
  }
};
