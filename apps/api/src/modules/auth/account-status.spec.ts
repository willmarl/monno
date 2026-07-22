import { describe, it, expect } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { evaluateAccountAccess } from './account-status';

describe('evaluateAccountAccess', () => {
  it('allows ACTIVE users', () => {
    expect(
      evaluateAccountAccess({ id: 1, status: 'ACTIVE' }),
    ).toEqual({ ok: true, expired: false });
  });

  it('blocks SUSPENDED without expiry', () => {
    expect(() =>
      evaluateAccountAccess({
        id: 1,
        status: 'SUSPENDED',
        statusReason: 'Spam',
      }),
    ).toThrow(UnauthorizedException);
  });

  it('blocks BANNED without expiry', () => {
    expect(() =>
      evaluateAccountAccess({ id: 1, status: 'BANNED' }),
    ).toThrow(UnauthorizedException);
  });

  it('blocks DELETED even if statusExpireAt is past', () => {
    expect(() =>
      evaluateAccountAccess({
        id: 1,
        status: 'DELETED',
        statusExpireAt: new Date(0),
      }),
    ).toThrow(UnauthorizedException);
  });

  it('marks expired SUSPENDED as ok+expired for auto-restore', () => {
    expect(
      evaluateAccountAccess({
        id: 1,
        status: 'SUSPENDED',
        statusExpireAt: new Date(Date.now() - 60_000),
      }),
    ).toEqual({ ok: true, expired: true });
  });
});
