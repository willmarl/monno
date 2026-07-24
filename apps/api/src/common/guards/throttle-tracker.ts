import { requireJwtSecrets } from '../../config/jwt-secrets';
import { JwtService } from '@nestjs/jwt';

/**
 * Read access JWT from cookie or Authorization header and return `sub`
 * after signature verification. Used for rate-limit tracking before
 * route-level JwtAccessGuard runs (so req.user is often unset).
 *
 * Invalid/missing tokens → null (caller falls back to IP).
 */
export function peekAccessTokenUserId(
  req: {
    cookies?: Record<string, string | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  },
  jwt: JwtService,
): number | null {
  const token = extractAccessToken(req);
  if (!token) return null;

  try {
    const { accessTokenSecret } = requireJwtSecrets();
    const payload = jwt.verify(token, { secret: accessTokenSecret }) as {
      sub?: string | number;
    };
    const sub = Number(payload?.sub);
    return Number.isFinite(sub) ? sub : null;
  } catch {
    return null;
  }
}

export function extractAccessToken(req: {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}): string | undefined {
  const cookie = req.cookies?.accessToken;
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }

  const auth = req.headers?.authorization ?? req.headers?.Authorization;
  const header = Array.isArray(auth) ? auth[0] : auth;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }

  return undefined;
}

export { clientIp } from '../request-ip';
