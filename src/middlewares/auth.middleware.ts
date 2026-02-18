import { Request, Response, NextFunction } from 'express';
import jwtService from '../infrastructure/jwt';
import { AppError } from './error.middleware';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      tenantId?: string;
      role?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = jwtService.verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.tenantId = payload.tenantId;
    req.role = payload.role;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Invalid or expired token', 401));
  }
};
