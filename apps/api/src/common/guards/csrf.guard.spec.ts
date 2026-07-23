import { describe, expect, it, afterEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

function mockCtx(req: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any;
}

describe('CsrfGuard', () => {
  const prev = process.env.COOKIE_SAMESITE;
  const guard = new CsrfGuard();

  afterEach(() => {
    if (prev === undefined) delete process.env.COOKIE_SAMESITE;
    else process.env.COOKIE_SAMESITE = prev;
  });

  it('is a no-op when SameSite is lax', () => {
    process.env.COOKIE_SAMESITE = 'lax';
    expect(
      guard.canActivate(
        mockCtx({ method: 'POST', originalUrl: '/posts', headers: {} }),
      ),
    ).toBe(true);
  });

  it('requires X-Requested-With when SameSite=none', () => {
    process.env.COOKIE_SAMESITE = 'none';
    expect(() =>
      guard.canActivate(
        mockCtx({ method: 'POST', originalUrl: '/posts', headers: {} }),
      ),
    ).toThrow(ForbiddenException);

    expect(
      guard.canActivate(
        mockCtx({
          method: 'POST',
          originalUrl: '/posts',
          headers: { 'x-requested-with': 'XMLHttpRequest' },
        }),
      ),
    ).toBe(true);
  });

  it('skips safe methods and stripe webhook', () => {
    process.env.COOKIE_SAMESITE = 'none';
    expect(
      guard.canActivate(
        mockCtx({ method: 'GET', originalUrl: '/posts', headers: {} }),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        mockCtx({
          method: 'POST',
          originalUrl: '/stripe/webhook',
          headers: {},
        }),
      ),
    ).toBe(true);
  });
});
