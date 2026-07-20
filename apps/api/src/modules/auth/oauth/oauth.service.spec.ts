import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { OauthService } from './oauth.service';

describe('OauthService.upsertOauthUser', () => {
  let service: OauthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
    };

    service = new OauthService(
      mockPrisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('links OAuth provider when existing email is already verified', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null); // no provider match
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 10,
      email: 'victim@example.com',
      isEmailVerified: true,
      tempEmail: null,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 10,
      googleId: 'g-1',
      isEmailVerified: true,
    });

    const result = await service.upsertOauthUser({
      provider: 'google',
      providerId: 'g-1',
      email: 'victim@example.com',
      name: 'Victim',
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        googleId: 'g-1',
        isEmailVerified: true,
      }),
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(result.id).toBe(10);
  });

  it('does not link into unverified account — strips email and creates new user', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null); // Strategy 1: no provider
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: 99,
        email: 'victim@example.com',
        isEmailVerified: false,
        tempEmail: null,
        username: 'attacker',
      })
      .mockResolvedValueOnce(null); // username available
    mockPrisma.user.update.mockResolvedValue({ id: 99, email: null });
    mockPrisma.user.create.mockResolvedValue({
      id: 100,
      email: 'victim@example.com',
      googleId: 'g-victim',
      isEmailVerified: true,
    });

    const result = await service.upsertOauthUser({
      provider: 'google',
      providerId: 'g-victim',
      email: 'victim@example.com',
      name: 'Victim Name',
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: { email: null, tempEmail: null },
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'victim@example.com',
        googleId: 'g-victim',
        isEmailVerified: true,
      }),
    });
    expect(result.id).toBe(100);
  });

  it('rejects OAuth email sync onto another verified user email', async () => {
    mockPrisma.user.findFirst
      .mockResolvedValueOnce({
        id: 1,
        email: 'old@example.com',
        deleted: false,
        status: 'ACTIVE',
      })
      .mockResolvedValueOnce({
        id: 2,
        email: 'taken@example.com',
        isEmailVerified: true,
      });

    await expect(
      service.upsertOauthUser({
        provider: 'google',
        providerId: 'g-1',
        email: 'taken@example.com',
        name: 'Someone',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
