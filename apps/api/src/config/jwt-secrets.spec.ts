import { describe, it, expect, afterEach } from 'vitest';
import { requireJwtSecrets } from './jwt-secrets';

describe('requireJwtSecrets', () => {
  const originalAccess = process.env.ACCESS_TOKEN_SECRET;
  const originalRefresh = process.env.REFRESH_TOKEN_SECRET;

  afterEach(() => {
    process.env.ACCESS_TOKEN_SECRET = originalAccess;
    process.env.REFRESH_TOKEN_SECRET = originalRefresh;
  });

  it('throws when access secret is missing', () => {
    delete process.env.ACCESS_TOKEN_SECRET;
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
    expect(() => requireJwtSecrets()).toThrow(/ACCESS_TOKEN_SECRET/);
  });

  it('throws when secrets are empty/whitespace', () => {
    process.env.ACCESS_TOKEN_SECRET = '   ';
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
    expect(() => requireJwtSecrets()).toThrow(/non-empty/);
  });

  it('returns trimmed secrets when both are set', () => {
    process.env.ACCESS_TOKEN_SECRET = '  access  ';
    process.env.REFRESH_TOKEN_SECRET = ' refresh ';
    expect(requireJwtSecrets()).toEqual({
      accessTokenSecret: 'access',
      refreshTokenSecret: 'refresh',
    });
  });
});
