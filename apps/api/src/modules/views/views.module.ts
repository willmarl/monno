import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';
import { ViewHandlerService } from '../../common/views/view-handler.service';
import { ViewRateLimiterService } from '../../common/rate-limiters/view-rate-limiter.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ViewsController],
  providers: [
    ViewsService,
    ViewHandlerService,
    ViewRateLimiterService,
    PrismaService,
  ],
  exports: [ViewsService, ViewHandlerService, ViewRateLimiterService],
})
export class ViewsModule {}
