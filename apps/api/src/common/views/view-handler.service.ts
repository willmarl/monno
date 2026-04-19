import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { ViewableResourceType } from '../types/resource.types';

type ViewableResourceConfig = {
  model: keyof PrismaService;
  label: string;
};

const VIEWABLE_RESOURCE_CONFIG: Record<
  ViewableResourceType,
  ViewableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  ARTICLE: { model: 'article', label: 'Article' },
};

@Injectable()
export class ViewHandlerService {
  // In-memory cache for spam prevention
  // Key: view:resourceType:resourceId:userId
  // Value: timestamp of last view
  private lastViewCache = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  /**
   * Increment view count with spam prevention
   * Returns true if view was counted, false if spam detected
   * @param resourceType - Type of resource (POST, VIDEO, ARTICLE)
   * @param resourceId - ID of the resource
   * @param userId - ID of the user (optional for anonymous views)
   * @param spamWindowMinutes - Time window to prevent duplicate views (default: 5 minutes)
   */
  async incrementViewCount(
    resourceType: ViewableResourceType,
    resourceId: number,
    userId?: number,
    spamWindowMinutes: number = 5,
  ): Promise<boolean> {
    // Validate resource exists
    await this.validateResourceExists(resourceType, resourceId);

    // For anonymous users, just count it
    if (!userId) {
      await this.incrementCount(resourceType, resourceId);
      return true;
    }

    // For authenticated users, check if they viewed recently
    const cacheKey = `view:${resourceType}:${resourceId}:${userId}`;
    const lastViewed = this.lastViewCache.get(cacheKey);

    if (lastViewed && Date.now() - lastViewed < spamWindowMinutes * 60 * 1000) {
      return false; // Spam detected, don't count
    }

    // Count the view and update cache
    await this.incrementCount(resourceType, resourceId);
    this.lastViewCache.set(cacheKey, Date.now());
    return true;
  }

  /**
   * Get view count for a resource
   */
  async getViewCount(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<number> {
    const delegate = this.prisma[
      VIEWABLE_RESOURCE_CONFIG[resourceType].model
    ] as any;
    const record = await delegate.findUnique({
      where: { id: resourceId },
      select: { viewCount: true },
    });
    return record?.viewCount ?? 0;
  }

  /**
   * Increment the view count for a resource
   */
  private async incrementCount(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<void> {
    const delegate = this.prisma[
      VIEWABLE_RESOURCE_CONFIG[resourceType].model
    ] as any;
    await delegate.update({
      where: { id: resourceId },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Validate that the resource exists
   */
  private async validateResourceExists(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<void> {
    const config = VIEWABLE_RESOURCE_CONFIG[resourceType];
    const delegate = this.prisma[config.model] as any;
    const record = await delegate.findUnique({ where: { id: resourceId } });
    if (!record || record.deleted) {
      throw new NotFoundException(`${config.label} not found`);
    }
  }
}
