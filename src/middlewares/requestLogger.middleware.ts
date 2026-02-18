import { Request, Response, NextFunction } from 'express';
import logger from '../infrastructure/logger';

/**
 * Request logger middleware
 * Logs request start, end, and duration
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const correlationId = req.correlationId || 'unknown';
  const userId = req.userId || 'anonymous';

  // Log request start
  logger.info('Request started', {
    correlationId,
    userId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      correlationId,
      userId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
