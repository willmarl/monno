import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBullBoardAdminMiddleware } from './bull-board-auth.middleware';

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: '',
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: string) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe('createBullBoardAdminMiddleware', () => {
  let prisma: any;
  let jwt: any;
  let middleware: ReturnType<typeof createBullBoardAdminMiddleware>;

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
    prisma = {
      session: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    jwt = { verify: vi.fn() };
    middleware = createBullBoardAdminMiddleware(prisma, jwt);
  });

  it('returns 401 without session cookie', async () => {
    const res = mockRes();
    const next = vi.fn();
    await middleware({ cookies: {}, headers: {} } as any, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not ADMIN', async () => {
    jwt.verify.mockReturnValue({ sub: 1 });
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 1,
      isValid: true,
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: new Date(),
      user: { status: 'ACTIVE', role: 'USER' },
    });

    const res = mockRes();
    const next = vi.fn();
    await middleware(
      {
        cookies: { sessionId: 's1', accessToken: 'tok' },
        headers: {},
      } as any,
      res,
      next,
    );

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for ADMIN with matching session', async () => {
    jwt.verify.mockReturnValue({ sub: 1 });
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 1,
      isValid: true,
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: new Date(),
      user: { status: 'ACTIVE', role: 'ADMIN' },
    });

    const res = mockRes();
    const next = vi.fn();
    await middleware(
      {
        cookies: { sessionId: 's1', accessToken: 'tok' },
        headers: {},
      } as any,
      res,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when JWT sub does not match session user', async () => {
    jwt.verify.mockReturnValue({ sub: 99 });
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 1,
      isValid: true,
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: new Date(),
      user: { status: 'ACTIVE', role: 'ADMIN' },
    });

    const res = mockRes();
    const next = vi.fn();
    await middleware(
      {
        cookies: { sessionId: 's1', accessToken: 'tok' },
        headers: {},
      } as any,
      res,
      next,
    );

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
