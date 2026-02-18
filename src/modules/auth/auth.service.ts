import bcrypt from 'bcrypt';
import userRepository from '../users/user.repository';
import jwtService from '../../infrastructure/jwt';
import logger from '../../infrastructure/logger';
import { RegisterDto, LoginDto, AuthResponse } from './auth.types';
import { AppError } from '../../middlewares/error.middleware';
import tenantRepository from '../tenant/tenant.repository';
import tenantService from '../tenant/tenant.service';

export class AuthService {
  /**
   * Register a new user
   * Automatically creates or finds a default tenant for new users
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Get or create default tenant
      let defaultTenant = await tenantRepository.findByName('Default Tenant');
      if (!defaultTenant) {
        defaultTenant = await tenantService.createTenant({
          name: 'Default Tenant',
          plan: 'free',
        });
        logger.info('Default tenant created for new user registration', { tenantId: defaultTenant.id });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user with default tenant
      const user = await userRepository.create({
        email: data.email,
        password: hashedPassword,
        tenantId: defaultTenant.id,
        role: 'user',
      });

      // Generate token
      const token = jwtService.generateToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      logger.info('User registered successfully', { userId: user.id, email: user.email, tenantId: user.tenantId });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error during registration', { error });
      throw new AppError('Registration failed', 500);
    }
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(data.email);
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate token
      const token = jwtService.generateToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      logger.info('User logged in successfully', { userId: user.id, email: user.email, tenantId: user.tenantId });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error during login', { error });
      throw new AppError('Login failed', 500);
    }
  }
}

export default new AuthService();
