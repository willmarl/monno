import { Injectable } from '@nestjs/common';
import { ViewHandlerService } from '../../common/views/view-handler.service';
import { ViewStatsDto } from './dto/view-stats.dto';
import type { ViewableResourceType } from 'src/common/types/resource.types';

@Injectable()
export class ViewsService {
  constructor(private viewHandler: ViewHandlerService) {}

  /**
   * Record a view for a resource with rate limiting
   * Returns {recorded: boolean, viewCount: number}
   * @param shouldCountView - If false, view is not counted (rate limited by middleware)
   */
  async recordView(
    resourceType: ViewableResourceType,
    resourceId: number,
    shouldCountView: boolean,
    userId?: number,
  ) {
    let recorded = false;

    // Only increment if rate limit allows
    if (shouldCountView) {
      await this.viewHandler.incrementViewCount(
        resourceType,
        resourceId,
        userId,
      );
      recorded = true;
    }

    const viewCount = await this.viewHandler.getViewCount(
      resourceType,
      resourceId,
    );

    return {
      recorded,
      viewCount,
    };
  }

  /**
   * Get view statistics for a resource
   */
  async getViewStats(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<ViewStatsDto> {
    const totalViews = await this.viewHandler.getViewCount(
      resourceType,
      resourceId,
    );

    return {
      totalViews,
    };
  }

  /**
   * Get view count for a resource
   */
  async getViewCount(resourceType: ViewableResourceType, resourceId: number) {
    return this.viewHandler.getViewCount(resourceType, resourceId);
  }
}
