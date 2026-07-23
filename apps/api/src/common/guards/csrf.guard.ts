import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { getCookieSameSite } from '../../config/cookie.config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Paths that cannot send a browser CSRF header (external callbacks). */
function isCsrfExempt(path: string): boolean {
  return (
    path.includes('/stripe/webhook') ||
    path.includes('/auth/google/callback') ||
    path.includes('/auth/github/callback')
  );
}

/**
 * Extra CSRF protection when auth cookies use SameSite=None
 * (true cross-site frontend/API). Classic form POST CSRF cannot set
 * custom headers; our web client always sends X-Requested-With.
 *
 * When SameSite is Lax/Strict (default), this guard is a no-op —
 * cookies are not sent on cross-site POSTs.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (getCookieSameSite() !== 'none') {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      url?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const method = (req.method || 'GET').toUpperCase();
    if (SAFE_METHODS.has(method)) {
      return true;
    }

    const path = req.originalUrl || req.url || '';
    if (isCsrfExempt(path)) {
      return true;
    }

    const raw = req.headers['x-requested-with'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === 'XMLHttpRequest') {
      return true;
    }

    throw new ForbiddenException('Missing CSRF header');
  }
}
