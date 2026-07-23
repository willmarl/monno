import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/** CSRF state for OAuth authorize → callback. */
export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

/** PKCE S256 pair (RFC 7636). */
export function generatePkcePair(): {
  verifier: string;
  challenge: string;
} {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

export function oauthParamSafeEqual(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_PKCE_COOKIE = 'oauth_pkce';
