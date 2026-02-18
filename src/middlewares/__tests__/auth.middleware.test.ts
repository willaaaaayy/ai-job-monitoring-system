import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth.middleware';
import jwtService from '../../infrastructure/jwt';
import { AppError } from '../error.middleware';

// Mock dependencies
jest.mock('../../infrastructure/jwt');
jest.mock('../../infrastructure/logger');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', () => {
    const token = 'valid_token';
    const payload = {
      userId: 'user1',
      email: 'test@example.com',
      tenantId: 'tenant1',
      role: 'user',
    };

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    (jwtService.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
    (jwtService.verifyToken as jest.Mock).mockReturnValue(payload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.userId).toBe('user1');
    expect(mockRequest.userEmail).toBe('test@example.com');
    expect(mockRequest.tenantId).toBe('tenant1');
    expect(mockRequest.role).toBe('user');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject request without token', () => {
    mockRequest.headers = {};

    (jwtService.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
  });

  it('should reject request with invalid token', () => {
    const token = 'invalid_token';

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    (jwtService.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
    (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Invalid or expired token');
  });

  it('should reject request with expired token', () => {
    const token = 'expired_token';

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    (jwtService.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
    (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token expired');
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });
});
