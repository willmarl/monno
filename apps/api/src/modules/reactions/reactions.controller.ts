import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReactionsService } from './reactions.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { rateLimitConfig } from 'src/config/rate-limit.config';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Throttle({ default: rateLimitConfig.veryLenient })
  @UseGuards(JwtAccessGuard)
  @Post('toggle')
  toggle(@Req() req, @Body() body: ToggleReactionDto) {
    const userId = Number(req.user.sub);
    const { resourceType, resourceId, emoji } = body;
    return this.reactionsService.toggleReaction(
      userId,
      resourceType,
      resourceId,
      emoji,
    );
  }
}
