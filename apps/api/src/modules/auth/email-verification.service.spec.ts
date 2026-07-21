import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService cooldown', () => {
  let service: EmailVerificationService;
  let mockPrisma: any;
  let mockQueue: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          email: 'user@test.com',
          tempEmail: null,
          isEmailVerified: false,
          username: 'user',
        }),
      },
      emailVerificationToken: {
        findFirst: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    mockQueue = { enqueueEmail: vi.fn().mockResolvedValue(undefined) };
    service = new EmailVerificationService(mockPrisma, mockQueue, {
      getLogoUrl: () => 'http://logo',
    } as any);
  });

  it('throws 429 when a recent verification token exists', async () => {
    mockPrisma.emailVerificationToken.findFirst.mockResolvedValue({ id: 'x' });

    await expect(service.sendVerificationEmail(1)).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(mockPrisma.emailVerificationToken.create).not.toHaveBeenCalled();
    expect(mockQueue.enqueueEmail).not.toHaveBeenCalled();
  });

  it('sends when no recent token exists', async () => {
    mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(null);

    await service.sendVerificationEmail(1);

    expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalled();
    expect(mockQueue.enqueueEmail).toHaveBeenCalled();
  });
});
