import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CaptureEventDto } from './dto/capture-event.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Capture an event for the authenticated user
   * POST /analytics/track
   * Body: { eventName: string, data?: object }
   */
  @Post('track')
  @UseGuards(JwtAccessGuard)
  @HttpCode(202) // 202 Accepted (we don't wait for PostHog response)
  async track(@Req() req, @Body() body: CaptureEventDto) {
    const userId = String(req.user.sub);
    const { eventName, data } = body;

    // Fire and forget - don't await, don't block user
    this.analyticsService.capture(userId, eventName, data).catch(() => {
      // Already logged in service
    });

    return { success: true };
  }
}
