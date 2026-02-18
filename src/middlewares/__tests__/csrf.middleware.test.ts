import { Request, Response, NextFunction } from 'express';
import { csrfProtection, attachCsrfToken, generateCsrfToken, validateCsrfToken } from '../csrf.middleware';
import redisClient from '../../infrastructure/redis';
import { AppError } from '../error.middleware';

// Mock dependencies
jest.mock('../../infrastructure/redis');
jest.mock('../../infrastructure/logger');

describe('CSRF Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/jobs',
      headers: {},
      body: {},
      userId: 'user1',
      tenantId: 'tenant1',
    };
    mockResponse = {
      setHeader: jest.fn(),
      locals: {},
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('csrfProtection', () => {
    it('should skip CSRF for GET requests', async () => {
      mockRequest.method = 'GET';

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip CSRF for webhook endpoints', async () => {
      mockRequest.path = '/webhooks/scoring';

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip CSRF for unauthenticated requests', async () => {
      delete mockRequest.userId;
      delete mockRequest.tenantId;

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without CSRF token', async () => {
      mockRequest.headers = {};

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CSRF token missing');
    });

    it('should validate CSRF token from header', async () => {
      const token = 'valid_csrf_token';
      mockRequest.headers = {
        'x-csrf-token': token,
      };

      const mockClient = {
        get: jest.fn().mockResolvedValue(token),
        expire: jest.fn().mockResolvedValue(1),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate CSRF token from body', async () => {
      const token = 'valid_csrf_token';
      mockRequest.body = {
        _csrf: token,
      };

      const mockClient = {
        get: jest.fn().mockResolvedValue(token),
        expire: jest.fn().mockResolvedValue(1),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid CSRF token', async () => {
      const token = 'invalid_token';
      mockRequest.headers = {
        'x-csrf-token': token,
      };

      const mockClient = {
        get: jest.fn().mockResolvedValue('different_token'),
        expire: jest.fn(),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      await csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Invalid CSRF token');
    });
  });

  describe('attachCsrfToken', () => {
    it('should attach CSRF token for authenticated users', async () => {
      const mockClient = {
        setex: jest.fn().mockResolvedValue('OK'),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      await attachCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
      expect(mockResponse.locals?.csrfToken).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach token for unauthenticated users', async () => {
      delete mockRequest.userId;
      delete mockRequest.tenantId;

      await attachCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateCsrfToken', () => {
    it('should return true for valid token', async () => {
      const token = 'valid_token';
      const mockClient = {
        get: jest.fn().mockResolvedValue(token),
        expire: jest.fn().mockResolvedValue(1),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      const result = await validateCsrfToken(token, 'user1', 'tenant1');

      expect(result).toBe(true);
      expect(mockClient.expire).toHaveBeenCalled();
    });

    it('should return false for invalid token', async () => {
      const token = 'invalid_token';
      const mockClient = {
        get: jest.fn().mockResolvedValue('different_token'),
        expire: jest.fn(),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      const result = await validateCsrfToken(token, 'user1', 'tenant1');

      expect(result).toBe(false);
    });

    it('should return false if token not found in Redis', async () => {
      const token = 'nonexistent_token';
      const mockClient = {
        get: jest.fn().mockResolvedValue(null),
        expire: jest.fn(),
      };
      (redisClient.getClient as jest.Mock).mockReturnValue(mockClient);

      const result = await validateCsrfToken(token, 'user1', 'tenant1');

      expect(result).toBe(false);
    });
  });
});
