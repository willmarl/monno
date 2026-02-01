import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAccessGuard)
  @Post('toggle')
  toggle(@Req() req, @Body() body: ToggleLikeDto) {
    const userId = req.user.sub;
    const { postId } = body;

    return this.likesService.toggleLike(userId, postId);
  }
}
