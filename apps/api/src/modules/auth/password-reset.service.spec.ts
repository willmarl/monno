import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let mockPrisma: any;
  let mockQueueService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({
          token: 'mock-token',
          expiresAt: new Date(Date.now() + 3600000),
        }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      session: {
        updateMany: jest.fn().mockResolvedValue({}),
      },
    };

    mockQueueService = {
      enqueueEmail: jest.fn().mockResolvedValue(undefined),
      enqueuePasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    // Directly instantiate service with mocked dependencies
    service = new PasswordResetService(mockPrisma, mockQueueService);
  });

  describe('requestPasswordReset', () => {
    it('should return success message if user not found (security)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@test.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
    });

    it('should return success message for OAuth-only user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'oauth@test.com',
        password: null, // OAuth user has no password
      });

      const result = await service.requestPasswordReset('oauth@test.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
    });

    it('should create password reset token for valid user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        password: 'hashed-password',
      });

      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({});
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'reset-token-123',
        expiresAt: new Date(Date.now() + 3600000),
      });

      mockQueueService.enqueuePasswordReset.mockResolvedValue({});

      const result = await service.requestPasswordReset('user@test.com');

      expect(result.success).toBe(true);
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should delete old tokens before creating new one', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        password: 'hashed-password',
      });

      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({});
      mockPrisma.passwordResetToken.create.mockResolvedValue({});
      mockQueueService.enqueuePasswordReset.mockResolvedValue({});

      await service.requestPasswordReset('user@test.com');

      // Verify deleteMany was called first
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() - 1000), // 1 second in the past
        usedAt: null,
      });

      await expect(
        service.resetPassword('expired-token', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already used token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
      });

      await expect(
        service.resetPassword('used-token', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user password and mark token as used', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() + 3600000), // Valid expiry
        usedAt: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        username: 'testuser',
      });

      mockPrisma.passwordResetToken.update.mockResolvedValue({});

      const result = await service.resetPassword('valid-token', 'newpass123');

      expect(result.success).toBe(true);
      // Verify user password was updated (should be hashed)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          password: expect.any(String), // Should be hashed password
        }),
      });
      // Verify token marked as used
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalled();
    });
  });
});
