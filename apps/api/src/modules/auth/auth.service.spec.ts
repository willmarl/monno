import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockPrisma: any;
  let mockJwt: any;
  let mockGeolocationService: any;
  let mockRiskScoringService: any;
  let mockEmailVerification: any;

  beforeEach(() => {
    // Mock all dependencies
    mockUsersService = {
      create: vi.fn(),
      findByUsernameAuth: vi.fn(),
    };

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      session: {
        create: vi.fn(),
      },
      passwordResetToken: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };

    mockJwt = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    mockGeolocationService = {
      getGeolocation: vi.fn().mockResolvedValue(null),
      formatLocation: vi.fn(),
    };

    mockRiskScoringService = {
      assessLoginRisk: vi.fn().mockResolvedValue({
        riskScore: 0,
        isNewLocation: false,
        isNewDevice: false,
      }),
    };

    mockEmailVerification = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    };

    // Instantiate service with mocked dependencies
    service = new AuthService(
      mockUsersService,
      mockPrisma,
      mockJwt,
      mockGeolocationService,
      mockRiskScoringService,
      mockEmailVerification,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid username', async () => {
      mockUsersService.findByUsernameAuth.mockResolvedValue(null);

      const mockRequest = {
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      } as any;

      await expect(
        service.login(
          { username: 'nonexistent', password: 'pass' },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findByUsernameAuth.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('correct-password', 10),
        status: 'ACTIVE',
      });

      const mockRequest = {
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      } as any;

      await expect(
        service.login(
          { username: 'testuser', password: 'wrong-password' },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended account', async () => {
      mockUsersService.findByUsernameAuth.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password', 10),
        status: 'SUSPENDED',
        statusReason: 'Spam',
      });

      const mockRequest = {
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      } as any;

      await expect(
        service.login(
          { username: 'testuser', password: 'password' },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid login', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      mockUsersService.findByUsernameAuth.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        status: 'ACTIVE',
        role: 'USER',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        status: 'ACTIVE',
        role: 'USER',
      });

      mockJwt.sign.mockReturnValue('mock-token');
      mockGeolocationService.getGeolocation.mockResolvedValue(null);
      mockRiskScoringService.assessLoginRisk.mockResolvedValue({
        riskScore: 0,
        isNewLocation: false,
        isNewDevice: false,
      });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

      const mockRequest = {
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      } as any;

      const result = await service.login(
        { username: 'testuser', password: 'password' },
        mockRequest,
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('sessionId');
    });
  });

  describe('issueTokens', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.issueTokens(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if account is not ACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        status: 'BANNED',
        statusReason: 'Violation',
      });

      await expect(service.issueTokens(1)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return tokens without session metadata', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        status: 'ACTIVE',
        role: 'USER',
      });

      mockJwt.sign.mockReturnValue('mock-token');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.issueTokens(1);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('sessionId');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should create session when session metadata is provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        status: 'ACTIVE',
        role: 'USER',
      });

      mockJwt.sign.mockReturnValue('mock-token');
      mockGeolocationService.getGeolocation.mockResolvedValue(null);
      mockRiskScoringService.assessLoginRisk.mockResolvedValue({
        riskScore: 0,
        isNewLocation: false,
        isNewDevice: false,
      });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

      const result = await service.issueTokens(1, {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      });

      expect(result).toHaveProperty('sessionId');
      expect(mockPrisma.session.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens(999, 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        refreshToken: await bcrypt.hash('stored-token', 10),
      });

      await expect(service.refreshTokens(1, 'wrong-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens for valid refresh token', async () => {
      const storedToken = await bcrypt.hash('valid-token', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        refreshToken: storedToken,
        status: 'ACTIVE',
        role: 'USER',
      });

      mockJwt.sign.mockReturnValue('new-token');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.refreshTokens(1, 'valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
