import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ViewsService } from './views.service';
import { RateLimitView } from '../../common/decorators/rate-limit-view.decorator';
import { CreateViewDto } from './dto/create-view.dto';
import { ViewStatsParamDto } from './dto/view-stats-param.dto';

@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  /**
   * Record a view for a resource
   * POST /views - Can be authenticated (userId from JWT) or anonymous
   * Rate limited to once per user/IP per 5 minutes
   */
  @Post()
  async recordView(
    @Req() req,
    @Body() body: CreateViewDto,
    @RateLimitView() shouldCountView: boolean,
  ) {
    const userId = req.user?.sub ? Number(req.user.sub) : undefined;
    const { resourceType, resourceId } = body;

    return this.viewsService.recordView(
      resourceType,
      resourceId,
      shouldCountView,
      userId,
    );
  }

  /**
   * Get view statistics for a resource
   * GET /views/:resourceType/:resourceId
   */
  @Get(':resourceType/:resourceId')
  async getViewStats(@Param() params: ViewStatsParamDto) {
    return this.viewsService.getViewStats(
      params.resourceType,
      Number(params.resourceId),
    );
  }
}
