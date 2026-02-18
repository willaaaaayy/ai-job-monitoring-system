import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import crypto from 'crypto';
import redisClient from '../infrastructure/redis';
import logger from '../infrastructure/logger';

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_TOKEN_TTL = 3600; // 1 hour

/**
 * Generate CSRF token and store it in Redis with session
 */
export async function generateCsrfToken(userId: string, tenantId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionKey = `csrf:${userId}:${tenantId}`;
  
  try {
    const client = redisClient.getClient();
    // Store token in Redis with TTL
    await client.setex(sessionKey, CSRF_TOKEN_TTL, token);
    logger.debug('CSRF token generated and stored', { userId, tenantId });
    return token;
  } catch (error) {
    logger.error('Failed to store CSRF token', { error, userId, tenantId });
    throw new AppError('Failed to generate CSRF token', 500);
  }
}

/**
 * Validate CSRF token against Redis session storage
 */
async function validateCsrfToken(
  token: string,
  userId: string,
  tenantId: string
): Promise<boolean> {
  if (!token || typeof token !== 'string' || token.length < 32) {
    return false;
  }

  try {
    const client = redisClient.getClient();
    const sessionKey = `csrf:${userId}:${tenantId}`;
    const storedToken = await client.get(sessionKey);

    if (!storedToken) {
      logger.warn('CSRF token not found in session', { userId, tenantId });
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    );

    if (isValid) {
      // Refresh TTL on successful validation
      await client.expire(sessionKey, CSRF_TOKEN_TTL);
      logger.debug('CSRF token validated successfully', { userId, tenantId });
    } else {
      logger.warn('CSRF token mismatch', { userId, tenantId });
    }

    return isValid;
  } catch (error) {
    logger.error('Failed to validate CSRF token', { error, userId, tenantId });
    return false;
  }
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (they use signature verification instead)
  if (req.path.startsWith('/webhooks/') || req.path.startsWith('/billing/webhook')) {
    return next();
  }

  // Skip CSRF for health and metrics endpoints
  if (req.path === '/health' || req.path === '/metrics') {
    return next();
  }

  // Skip CSRF for auth endpoints (they handle their own security)
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  // Get userId and tenantId from request (set by auth middleware)
  const userId = req.userId;
  const tenantId = req.tenantId;

  if (!userId || !tenantId) {
    // If not authenticated, skip CSRF (auth middleware will handle it)
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!token) {
    return next(new AppError('CSRF token missing', 403));
  }

  // Validate token against Redis session storage
  const isValid = await validateCsrfToken(token as string, userId, tenantId);

  if (!isValid) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  next();
};

/**
 * Middleware to attach CSRF token to response
 * Generates and stores token in Redis, attaches to response header
 */
export const attachCsrfToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;

    // Only generate token for authenticated users
    if (userId && tenantId) {
      const token = await generateCsrfToken(userId, tenantId);
      res.setHeader('X-CSRF-Token', token);
      res.locals.csrfToken = token;
    }

    next();
  } catch (error) {
    logger.error('Failed to attach CSRF token', { error });
    // Don't fail the request if CSRF token generation fails
    next();
  }
};
