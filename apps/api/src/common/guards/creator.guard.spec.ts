import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreatorGuard } from './creator.guard';

function mockCtx(req: Record<string, unknown>, resourceType = 'post') {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('CreatorGuard', () => {
  let guard: CreatorGuard;
  let prisma: any;
  let reflector: any;

  beforeEach(() => {
    prisma = {
      post: { findUnique: vi.fn() },
    };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue('post'),
    };
    guard = new CreatorGuard(prisma, reflector);
  });

  it('allows owner to PATCH an active post', async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: 1,
      creatorId: 10,
      deleted: false,
    });
    await expect(
      guard.canActivate(
        mockCtx({
          method: 'PATCH',
          user: { sub: 10 },
          params: { id: '1' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects PATCH on soft-deleted post', async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: 1,
      creatorId: 10,
      deleted: true,
    });
    await expect(
      guard.canActivate(
        mockCtx({
          method: 'PATCH',
          user: { sub: 10 },
          params: { id: '1' },
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows DELETE on soft-deleted post (service returns 410)', async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: 1,
      creatorId: 10,
      deleted: true,
    });
    await expect(
      guard.canActivate(
        mockCtx({
          method: 'DELETE',
          user: { sub: 10 },
          params: { id: '1' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects non-owner', async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: 1,
      creatorId: 10,
      deleted: false,
    });
    await expect(
      guard.canActivate(
        mockCtx({
          method: 'PATCH',
          user: { sub: 99 },
          params: { id: '1' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
