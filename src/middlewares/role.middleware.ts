import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export type UserRole = 'admin' | 'user';

/**
 * Middleware to require a specific role
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role) {
      throw new AppError('Role not found in request', 401);
    }

    if (requiredRole === 'admin' && req.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    // User role can access user endpoints
    if (requiredRole === 'user' && req.role !== 'user' && req.role !== 'admin') {
      throw new AppError('User access required', 403);
    }

    next();
  };
};
