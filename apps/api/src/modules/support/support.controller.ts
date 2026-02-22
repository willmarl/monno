import { Throttle } from '@nestjs/throttler';
import { Post, Req, Body, Logger, UseGuards } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { SupportService } from './support.service';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';

@Controller('support')
export class SupportController {
  constructor(private readonly postsService: SupportService) {}

  @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 per minute
  @Post()
  @UseGuards(JwtAccessOptionalGuard)
  create(@Req() req, @Body() body: CreateTicketDto) {
    const userId = req.user?.sub; // undefined if no user or no sub

    return this.postsService.create(body, userId);
  }
}
