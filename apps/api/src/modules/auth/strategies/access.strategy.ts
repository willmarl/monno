import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return req?.cookies?.accessToken;
        },
      ]),
      secretOrKey: process.env.ACCESS_TOKEN_SECRET || '',
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

    // Check if session has expired
    const now = new Date();
    if (session.expiresAt && session.expiresAt < now) {
      throw new UnauthorizedException('Session has expired');
    }

    // Check if user account is active
    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        `Account is ${session.user.status.toLowerCase()}${session.user.statusReason ? ': ' + session.user.statusReason : ''}`,
      );
    }

    return payload; // attaches payload to req.user
  }
}
