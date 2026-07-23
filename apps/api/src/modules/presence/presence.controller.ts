import { Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { cookieConfig } from 'src/config/cookie.config';
import { isValidAnonId, PresenceService } from './presence.service';

@ApiTags('presence')
@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @ApiOperation({
    summary:
      'Guest presence heartbeat (anonId cookie + Redis TTL). Skipped when logged in.',
  })
  @Post('heartbeat')
  @Throttle({ default: rateLimitConfig.veryLenient })
  async heartbeat(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; guest: boolean }> {
    // Logged-in users are counted via Session.lastUsedAt — avoid double-count.
    if (req.cookies?.accessToken && req.cookies?.sessionId) {
      return { ok: true, guest: false };
    }

    let anonId = req.cookies?.anonId as string | undefined;
    if (!isValidAnonId(anonId)) {
      anonId = randomUUID();
      res.cookie('anonId', anonId, cookieConfig.anonId);
    }

    await this.presence.touchGuest(anonId!);
    return { ok: true, guest: true };
  }
}
