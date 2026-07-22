import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma.service';
import { requireJwtSecrets } from '../../../config/jwt-secrets';
import { evaluateAccountAccess } from '../account-status';

/** Min age before we rewrite lastUsedAt (lenient presence tracking). */
const LAST_USED_TOUCH_MS = 30_000;

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(private prisma: PrismaService) {
    const { accessTokenSecret } = requireJwtSecrets();
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return req?.cookies?.accessToken;
        },
      ]),
      secretOrKey: accessTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // Session ID is required - accessToken must be coupled with an active session
    const sessionId = req?.cookies?.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException(
        'Session ID required. Please log in again.',
      );
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    // Session must exist and be valid
    if (!session || !session.isValid) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    // Access JWT must belong to the same user as the session cookie
    const tokenUserId = Number(payload?.sub);
    if (!Number.isFinite(tokenUserId) || tokenUserId !== session.userId) {
      throw new UnauthorizedException(
        'Token does not match session. Please log in again.',
      );
    }

    // Check if session has expired
    const now = new Date();
    if (session.expiresAt && session.expiresAt < now) {
      throw new UnauthorizedException('Session has expired');
    }

    const access = evaluateAccountAccess(session.user);
    let role = session.user.role;
    if (access.expired) {
      const restored = await this.prisma.user.update({
        where: { id: session.user.id },
        data: {
          status: 'ACTIVE',
          statusExpireAt: null,
          statusReason: null,
        },
      });
      role = restored.role;
    }

    // Throttled presence touch — fire-and-forget, never fail the request
    if (now.getTime() - session.lastUsedAt.getTime() >= LAST_USED_TOUCH_MS) {
      this.prisma.session
        .update({
          where: { id: sessionId },
          data: { lastUsedAt: now },
        })
        .catch(() => {});
    }

    // Identity from DB/session — not from JWT claims (role can change after issue)
    return {
      sub: session.user.id,
      role,
    };
  }
}
