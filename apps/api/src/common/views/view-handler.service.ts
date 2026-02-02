import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { ViewableResourceType } from '../types/resource.types';

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
    switch (resourceType) {
      case 'POST': {
        const post = await this.prisma.post.findUnique({
          where: { id: resourceId },
          select: { viewCount: true },
        });
        return post?.viewCount ?? 0;
      }
      // case 'VIDEO': {
      //   // TODO: Implement when video model is added
      //   const video = await this.prisma.video.findUnique({
      //     where: { id: resourceId },
      //     select: { viewCount: true },
      //   });
      //   return video?.viewCount ?? 0;
      // }
      // case 'ARTICLE': {
      //   // TODO: Implement when article model is added
      //   const article = await this.prisma.article.findUnique({
      //     where: { id: resourceId },
      //     select: { viewCount: true },
      //   });
      //   return article?.viewCount ?? 0;
      // }
      default:
        throw new BadRequestException('Invalid resource type');
    }
  }

  /**
   * Increment the view count for a resource
   */
  private async incrementCount(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<void> {
    switch (resourceType) {
      case 'POST':
        await this.prisma.post.update({
          where: { id: resourceId },
          data: { viewCount: { increment: 1 } },
        });
        break;
      // case 'VIDEO':
      //   await this.prisma.video.update({
      //     where: { id: resourceId },
      //     data: { viewCount: { increment: 1 } },
      //   });
      //   break;
      // case 'ARTICLE':
      //   await this.prisma.article.update({
      //     where: { id: resourceId },
      //     data: { viewCount: { increment: 1 } },
      //   });
      //   break;
      default:
        throw new BadRequestException('Invalid resource type');
    }
  }

  /**
   * Validate that the resource exists
   */
  private async validateResourceExists(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<void> {
    switch (resourceType) {
      case 'POST': {
        const post = await this.prisma.post.findUnique({
          where: { id: resourceId },
        });
        if (!post || post.deleted) {
          throw new NotFoundException('Post not found');
        }
        break;
      }
      // case 'VIDEO': {
      //   // TODO: Implement when video model is added
      //   const video = await this.prisma.video.findUnique({
      //     where: { id: resourceId },
      //   });
      //   if (!video || video.deleted) {
      //     throw new NotFoundException('Video not found');
      //   }
      //   break;
      // }
      // case 'ARTICLE': {
      //   // TODO: Implement when article model is added
      //   const article = await this.prisma.article.findUnique({
      //     where: { id: resourceId },
      //   });
      //   if (!article || article.deleted) {
      //     throw new NotFoundException('Article not found');
      //   }
      //   break;
      // }
      default:
        throw new BadRequestException('Invalid resource type');
    }
  }
}
