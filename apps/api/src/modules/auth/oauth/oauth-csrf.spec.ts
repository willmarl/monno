import { describe, expect, it } from 'vitest';
import {
  generateOAuthState,
  generatePkcePair,
  oauthParamSafeEqual,
} from './oauth-csrf';
import { createHash } from 'crypto';

describe('oauth-csrf', () => {
  it('generates unique opaque states', () => {
    const a = generateOAuthState();
    const b = generateOAuthState();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it('PKCE challenge is S256 of verifier', () => {
    const { verifier, challenge } = generatePkcePair();
    const expected = createHash('sha256')
      .update(verifier)
      .digest('base64url');
    expect(challenge).toBe(expected);
  });

  it('safeEqual rejects mismatch and missing values', () => {
    expect(oauthParamSafeEqual('abc', 'abc')).toBe(true);
    expect(oauthParamSafeEqual('abc', 'abd')).toBe(false);
    expect(oauthParamSafeEqual('abc', null)).toBe(false);
    expect(oauthParamSafeEqual(undefined, 'abc')).toBe(false);
  });
});
