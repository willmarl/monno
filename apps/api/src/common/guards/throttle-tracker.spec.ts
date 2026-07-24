import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import {
  clientIp,
  extractAccessToken,
  peekAccessTokenUserId,
} from './throttle-tracker';

describe('throttle-tracker', () => {
  const prevAccess = process.env.ACCESS_TOKEN_SECRET;
  const prevRefresh = process.env.REFRESH_TOKEN_SECRET;
  let jwt: JwtService;

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-for-throttle';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-throttle';
    jwt = new JwtService({});
  });

  afterEach(() => {
    if (prevAccess === undefined) delete process.env.ACCESS_TOKEN_SECRET;
    else process.env.ACCESS_TOKEN_SECRET = prevAccess;
    if (prevRefresh === undefined) delete process.env.REFRESH_TOKEN_SECRET;
    else process.env.REFRESH_TOKEN_SECRET = prevRefresh;
  });

  it('extracts token from cookie or Bearer header', () => {
    expect(
      extractAccessToken({ cookies: { accessToken: 'cookie-tok' } }),
    ).toBe('cookie-tok');
    expect(
      extractAccessToken({
        headers: { authorization: 'Bearer header-tok' },
      }),
    ).toBe('header-tok');
    expect(extractAccessToken({ cookies: {}, headers: {} })).toBeUndefined();
  });

  it('returns user id from a verified access token', () => {
    const token = jwt.sign(
      { sub: 99, role: 'USER' },
      { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '5m' },
    );
    expect(
      peekAccessTokenUserId({ cookies: { accessToken: token } }, jwt),
    ).toBe(99);
  });

  it('returns null for forged or invalid tokens', () => {
    expect(
      peekAccessTokenUserId({ cookies: { accessToken: 'not.a.jwt' } }, jwt),
    ).toBeNull();

    const forged = jwt.sign(
      { sub: 1 },
      { secret: 'wrong-secret', expiresIn: '5m' },
    );
    expect(
      peekAccessTokenUserId({ cookies: { accessToken: forged } }, jwt),
    ).toBeNull();
  });

  it('clientIp prefers req.ip', () => {
    expect(clientIp({ ip: '1.2.3.4' })).toBe('1.2.3.4');
    expect(clientIp({ socket: { remoteAddress: '::1' } })).toBe('::1');
  });
});
