import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ViewsService } from './views.service';
import { RateLimitView } from '../../common/decorators/rate-limit-view.decorator';
import { CreateViewDto } from './dto/create-view.dto';
import { ViewStatsParamDto } from './dto/view-stats-param.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ClearHistoryDto } from './dto/clear-history.dto';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  /**
   * Record a view for a resource
   * POST /views - authenticated (userId from JWT) or anonymous
   */
  @Post()
  @UseGuards(JwtAccessOptionalGuard)
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
   * List current user's view history (active rows only)
   * GET /views/history?resourceType=POST
   */
  @Get('history')
  @UseGuards(JwtAccessGuard)
  async getHistory(@Req() req, @Query() query: HistoryQueryDto) {
    const userId = Number(req.user.sub);
    return this.viewsService.findHistory(userId, query);
  }

  /**
   * Soft-clear view history for the current user
   * POST /views/history/clear
   */
  @Post('history/clear')
  @UseGuards(JwtAccessGuard)
  async clearHistory(@Req() req, @Body() body: ClearHistoryDto) {
    const userId = Number(req.user.sub);
    return this.viewsService.softClearAll(userId, body.resourceType);
  }

  /**
   * Soft-delete one history entry
   * DELETE /views/history/:id
   */
  @Delete('history/:id')
  @UseGuards(JwtAccessGuard)
  async deleteHistoryEntry(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = Number(req.user.sub);
    return this.viewsService.softDeleteOne(userId, id);
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
