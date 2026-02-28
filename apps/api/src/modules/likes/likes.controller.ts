import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { rateLimitConfig } from 'src/config/rate-limit.config';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Throttle({ default: rateLimitConfig.veryLenient })
  @UseGuards(JwtAccessGuard)
  @Post('toggle')
  toggle(@Req() req, @Body() body: ToggleLikeDto) {
    const userId = Number(req.user.sub);
    const { resourceType, resourceId } = body;

    return this.likesService.toggleLike(userId, resourceType, resourceId);
  }
}
