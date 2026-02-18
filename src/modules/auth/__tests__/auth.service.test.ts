import authService from '../auth.service';
import userRepository from '../../users/user.repository';
import tenantService from '../../tenant/tenant.service';
import jwtService from '../../../infrastructure/jwt';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../users/user.repository');
jest.mock('../../tenant/tenant.service');
jest.mock('../../../infrastructure/jwt');
jest.mock('bcrypt');
jest.mock('../../../infrastructure/logger');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (tenantService.createTenant as jest.Mock).mockResolvedValue({
        id: 'tenant1',
        name: 'Test Tenant',
        plan: 'free',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: 'user1',
        email,
        tenantId: 'tenant1',
        role: 'user',
      });
      (jwtService.generateToken as jest.Mock).mockReturnValue('mock_token');

      const result = await authService.register({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBe('mock_token');
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user1',
        email,
      });

      await expect(authService.register({ email, password })).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user1',
        email,
        password: hashedPassword,
        tenantId: 'tenant1',
        role: 'user',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.generateToken as jest.Mock).mockReturnValue('mock_token');

      const result = await authService.login({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBe('mock_token');
    });

    it('should throw error with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrong_password';

      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user1',
        email,
        password: 'hashed_password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email, password })).rejects.toThrow();
    });
  });
});
