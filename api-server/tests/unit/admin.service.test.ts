import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminService } from '../../src/modules/admin/admin.service';
import { AdminRepository } from '../../src/modules/admin/admin.repository';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4000,
    DATABASE_URL: 'https://example.com/database',
    JWT_ACCESS_SECRET: 'test-access-secret-minimum-10',
    JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-10',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    AI_SERVICE_URL: 'http://localhost:8000',
    AI_SERVICE_TIMEOUT: 5000,
  },
}));

function buildMockRepository(): AdminRepository {
  return {
    createAdminUser: jest.fn(),
    findAdminUserByEmail: jest.fn(),
    findAdminUserById: jest.fn(),
    getAllAdminUsers: jest.fn(),
    updateAdminUser: jest.fn(),
    deleteAdminUser: jest.fn(),
    createAdminSession: jest.fn(),
    findAdminSessionByToken: jest.fn(),
    findAdminSessionByRefreshToken: jest.fn(),
    revokeAdminSession: jest.fn(),
    revokeAllAdminSessions: jest.fn(),
    logAdminActivity: jest.fn(),
    getActivityLogs: jest.fn(),
    getSettingByKey: jest.fn(),
    getSettingsByCategory: jest.fn(),
    getAllSettings: jest.fn(),
    createOrUpdateSetting: jest.fn(),
    createSystemAudit: jest.fn(),
    getSystemAuditLogs: jest.fn(),
    getDashboardMetrics: jest.fn(),
    getAllShops: jest.fn(),
    getShopById: jest.fn(),
    updateShopSubscription: jest.fn(),
    toggleShopActive: jest.fn(),
    updateFeatureFlags: jest.fn(),
    getUsageAnalytics: jest.fn(),
    getAllUsers: jest.fn(),
    updateLastLogin: jest.fn(),
    getShopMetrics: jest.fn(),
  } as unknown as AdminRepository;
}

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AdminService', () => {
  let service: AdminService;
  let mockRepository: AdminRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = buildMockRepository();
    service = new AdminService(mockRepository);
  });

  describe('register', () => {
    const validInput = {
      email: 'admin@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new admin user', async () => {
      (mockRepository.findAdminUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed-password');
      (mockRepository.createAdminUser as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: validInput.email,
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        role: 'MANAGER',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (mockRepository.createAdminSession as jest.Mock).mockResolvedValue({
        id: 'session-id',
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(),
      });
      (mockJwt.sign as unknown as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(validInput);

      expect(mockRepository.findAdminUserByEmail).toHaveBeenCalledWith(validInput.email);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validInput.password, 12);
      expect(mockRepository.createAdminUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInput.email,
          password: 'hashed-password',
          firstName: validInput.firstName,
          lastName: validInput.lastName,
          role: 'MANAGER',
        })
      );
      expect(result.id).toBe('admin-id');
      expect(result.email).toBe(validInput.email);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('should throw BadRequestError when passwords do not match', async () => {
      const invalidInput = { ...validInput, confirmPassword: 'different-password' };

      await expect(service.register(invalidInput)).rejects.toThrow('Passwords do not match');
    });

    it('should throw BadRequestError when password is too short', async () => {
      const invalidInput = { ...validInput, password: 'short', confirmPassword: 'short' };

      await expect(service.register(invalidInput)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should throw ConflictError when email already exists', async () => {
      (mockRepository.findAdminUserByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: validInput.email,
      });

      await expect(service.register(validInput)).rejects.toThrow('Email is already registered');
    });
  });
});
