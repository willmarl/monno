/**
 * Cookie configuration for authentication tokens
 * Automatically adapts to development vs production environments
 */

// Extract domain from FRONTEND_URL for cookie domain property
// For production: https://example.com → .example.com
// For development: http://localhost:3000 → undefined (browser default)
const getDomain = () => {
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    const url = new URL(process.env.FRONTEND_URL);
    // Extract domain and add leading dot for subdomain matching
    return '.' + url.hostname;
  }
  return undefined;
};

const cookieDefaults = {
  httpOnly: true,
  path: '/',
  domain: getDomain(),
  sameSite:
    process.env.NODE_ENV === 'production'
      ? ('none' as const)
      : ('strict' as const),
  secure: process.env.NODE_ENV === 'production',
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
   * Configuration for clearing cookies (logout)
   * Expires date set to past to delete the cookie
   */
  clear: {
    ...cookieDefaults,
    expires: new Date(0),
  },
};
