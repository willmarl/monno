import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { evaluateAccountAccess } from '../auth/account-status';

/** Min age before we rewrite lastUsedAt (keep in sync with access.strategy). */
const LAST_USED_TOUCH_MS = 30_000;

/**
 * Express middleware for Bull Board — requires the same accessToken + sessionId
 * cookies (or Bearer access token) as the rest of the API, plus ADMIN role.
 * Nest guards do not apply to `app.use()` mounts.
 */
export function createBullBoardAdminMiddleware(
  prisma: PrismaService,
  jwt: JwtService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        res.status(503).send('Auth not configured');
        return;
      }

      const sessionId = req.cookies?.sessionId as string | undefined;
      if (!sessionId) {
        res.status(401).send('Session required. Log in as ADMIN first.');
        return;
      }

      const authHeader = req.headers.authorization;
      const bearer =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : undefined;
      const accessToken =
        bearer || (req.cookies?.accessToken as string | undefined);

      if (!accessToken) {
        res.status(401).send('Access token required. Log in as ADMIN first.');
        return;
      }

      let payload: { sub?: number | string };
      try {
        payload = jwt.verify(accessToken, { secret }) as {
          sub?: number | string;
        };
      } catch {
        res.status(401).send('Invalid or expired access token');
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session || !session.isValid) {
        res.status(401).send('Session is invalid or expired');
        return;
      }

      const tokenUserId = Number(payload.sub);
      if (!Number.isFinite(tokenUserId) || tokenUserId !== session.userId) {
        res.status(401).send('Token does not match session');
        return;
      }

      const now = new Date();
      if (session.expiresAt && session.expiresAt < now) {
        res.status(401).send('Session has expired');
        return;
      }

      try {
        const access = evaluateAccountAccess(session.user);
        if (access.expired) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              status: 'ACTIVE',
              statusExpireAt: null,
              statusReason: null,
            },
          });
        }
      } catch {
        res
          .status(401)
          .send(`Account is ${session.user.status.toLowerCase()}`);
        return;
      }

      if (session.user.role !== 'ADMIN') {
        res.status(403).send('Admin role required');
        return;
      }

      if (now.getTime() - session.lastUsedAt.getTime() >= LAST_USED_TOUCH_MS) {
        prisma.session
          .update({
            where: { id: sessionId },
            data: { lastUsedAt: now },
          })
          .catch(() => {});
      }

      next();
    } catch {
      res.status(401).send('Unauthorized');
    }
  };
}
