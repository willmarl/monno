import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractTokenFromCookie,
      ]),
      secretOrKey: process.env.REFRESH_TOKEN_SECRET || '',
      passReqToCallback: true,
    });
  }

  private static extractTokenFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies['refreshToken']) {
      return req.cookies['refreshToken'];
    }
    return null;
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies['refreshToken'];
    return {
      ...payload,
      refreshToken,
    };
  }
}
