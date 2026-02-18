import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { registerSchema, loginSchema } from './auth.types';
import { ValidationError } from '../../middlewares/error.middleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid registration data', errors);
      }

      const result = await authService.register(validationResult.data);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid login data', errors);
      }

      const result = await authService.login(validationResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
