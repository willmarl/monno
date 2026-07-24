import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import {
  clientIp,
  peekAccessTokenUserId,
} from './throttle-tracker';

/**
 * UserAwareThrottlerGuard - Smart rate limiting
 *
 * For authenticated users: throttle by userId (from req.user or verified access JWT)
 * For guests: throttle by IP address
 *
 * Global guard runs before route JwtAccessGuard, so we verify the access cookie
 * lightly for tracking only — not a substitute for full session auth.
 */
@Injectable()
export class UserAwareThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwt: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.sub != null) {
      return `user-${req.user.sub}`;
    }

    const userId = peekAccessTokenUserId(req, this.jwt);
    if (userId != null) {
      return `user-${userId}`;
    }

    return clientIp(req);
  }
}
