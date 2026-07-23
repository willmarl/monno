/**
 * Cookie configuration for authentication tokens
 * Automatically adapts to development vs production environments
 */

export type CookieSameSite = 'lax' | 'strict' | 'none';

/**
 * SameSite policy for auth cookies.
 *
 * Default `lax` — correct when web + API share a registrable domain
 * (e.g. example.com + api.example.com). Cross-site form POSTs then
 * do not include cookies (classic CSRF mitigated).
 *
 * Set COOKIE_SAMESITE=none only when the frontend and API are on
 * *different* registrable domains (true cross-site). That requires
 * Secure cookies and the CSRF header guard (see CsrfGuard).
 */
export function getCookieSameSite(): CookieSameSite {
  const raw = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase().trim();
  if (raw === 'none' || raw === 'strict' || raw === 'lax') {
    return raw;
  }
  return 'lax';
}

// Extract domain from FRONTEND_URL for cookie domain property
// For production: https://example.com → .example.com
// For development: http://localhost:3000 → undefined (browser default)
const getDomain = () => {
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    const url = new URL(process.env.FRONTEND_URL);
    const apex = url.hostname.replace(/^www\./, '');
    return '.' + apex;
  }
  return undefined;
};

const sameSite = getCookieSameSite();

const cookieDefaults = {
  httpOnly: true,
  path: '/',
  domain: getDomain(),
  sameSite,
  // SameSite=None requires Secure; also Secure in production
  secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
};

export const cookieConfig = {
  /**
   * Configuration for access token cookie
   * Used in login, register, refresh endpoints
   */
  accessToken: cookieDefaults,

  /**
   * Configuration for refresh token cookie
   * Used in login, register, refresh endpoints
   */
  refreshToken: cookieDefaults,

  /**
   * Configuration for session ID cookie
   * Used for session-based authentication
   */
  sessionId: cookieDefaults,

  /**
   * Anonymous guest id for "active now" presence (Redis TTL).
   * Long-lived cookie; presence window is Redis EX, not cookie Max-Age.
   */
  anonId: {
    ...cookieDefaults,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  },

  /**
   * Short-lived OAuth CSRF state + PKCE verifier (authorize → callback).
   */
  oauthFlow: {
    ...cookieDefaults,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Configuration for clearing cookies (logout)
   * Expires date set to past to delete the cookie
   */
  clear: {
    ...cookieDefaults,
    expires: new Date(0),
  },
};
