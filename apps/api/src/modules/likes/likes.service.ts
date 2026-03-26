import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { LikeableResourceType } from 'src/common/types/resource.types';

type ResourceConfig = {
  /** Prisma delegate key, e.g. 'post' → this.prisma.post */
  model: keyof PrismaService;
  /** Human-readable label used in error messages */
  label: string;
};

const LIKEABLE_RESOURCE_CONFIG: Record<LikeableResourceType, ResourceConfig> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
  ARTICLE: { model: 'article', label: 'Article' },
};

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Toggle like for a resource (post, video, article, etc.)
   * Uses denormalized likeCount for O(1) read performance
   */
  async toggleLike(
    userId: number,
    resourceType: LikeableResourceType,
    resourceId: number,
  ) {
    // Validate resource exists based on type
    await this.validateResourceExists(resourceType, resourceId);

    // Check if like exists
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    const delegate = this.prisma[
      LIKEABLE_RESOURCE_CONFIG[resourceType].model
    ] as any;

    if (existing) {
      // Unlike (delete) and decrement likeCount
      await this.prisma.like.delete({
        where: {
          userId_resourceType_resourceId: { userId, resourceType, resourceId },
        },
      });
      await delegate.update({
        where: { id: resourceId },
        data: { likeCount: { decrement: 1 } },
      });
    } else {
      // Like (create) and increment likeCount
      await this.prisma.like.create({
        data: { userId, resourceType, resourceId },
      });
      await delegate.update({
        where: { id: resourceId },
        data: { likeCount: { increment: 1 } },
      });
    }

    // Get denormalized likeCount (much faster than COUNT query)
    const record = await delegate.findUnique({
      where: { id: resourceId },
      select: { likeCount: true },
    });

    return {
      liked: !existing,
      likeCount: record?.likeCount ?? 0,
    };
  }

  /**
   * Get like count for a resource using denormalized counter
   * O(1) read instead of O(n) COUNT aggregation
   */
  async getLikeCount(resourceType: LikeableResourceType, resourceId: number) {
    const delegate = this.prisma[
      LIKEABLE_RESOURCE_CONFIG[resourceType].model
    ] as any;
    const record = await delegate.findUnique({
      where: { id: resourceId },
      select: { likeCount: true },
    });
    return record?.likeCount ?? 0;
  }

  /**
   * Check if a user liked a resource
   */
  async isLikedByUser(
    userId: number,
    resourceType: LikeableResourceType,
    resourceId: number,
  ) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    return !!like;
  }

  /**
   * Validate that the resource exists (post, article, comment, etc.)
   * Driven by LIKEABLE_RESOURCE_CONFIG — add a new entry there to support a new type.
   */
  private async validateResourceExists(
    resourceType: LikeableResourceType,
    resourceId: number,
  ) {
    const config = LIKEABLE_RESOURCE_CONFIG[resourceType];
    if (!config) {
      throw new BadRequestException('Invalid resource type');
    }

    const delegate = this.prisma[config.model] as any;
    const record = await delegate.findUnique({ where: { id: resourceId } });

    if (!record || record.deleted) {
      throw new NotFoundException(`${config.label} not found`);
    }
  }
}
