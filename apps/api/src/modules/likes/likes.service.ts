import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { LikeableResourceType } from 'src/common/types/resource.types';

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

    if (existing) {
      // Unlike (delete) and decrement likeCount
      await this.prisma.like.delete({
        where: {
          userId_resourceType_resourceId: { userId, resourceType, resourceId },
        },
      });
      // Decrement likeCount
      if (resourceType === 'POST') {
        await this.prisma.post.update({
          where: { id: resourceId },
          data: { likeCount: { decrement: 1 } },
        });
      } else if (resourceType === 'COMMENT') {
        await this.prisma.comment.update({
          where: { id: resourceId },
          data: { likeCount: { decrement: 1 } },
        });
      }
    } else {
      // Like (create) and increment likeCount
      await this.prisma.like.create({
        data: {
          userId,
          resourceType,
          resourceId,
        },
      });
      // Increment likeCount
      if (resourceType === 'POST') {
        await this.prisma.post.update({
          where: { id: resourceId },
          data: { likeCount: { increment: 1 } },
        });
      } else if (resourceType === 'COMMENT') {
        await this.prisma.comment.update({
          where: { id: resourceId },
          data: { likeCount: { increment: 1 } },
        });
      }
    }

    // Get denormalized likeCount (much faster than COUNT query)
    let likeCount = 0;
    if (resourceType === 'POST') {
      const post = await this.prisma.post.findUnique({
        where: { id: resourceId },
        select: { likeCount: true },
      });
      likeCount = post?.likeCount ?? 0;
    } else if (resourceType === 'COMMENT') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: resourceId },
        select: { likeCount: true },
      });
      likeCount = comment?.likeCount ?? 0;
    }

    return {
      liked: !existing,
      likeCount,
    };
  }

  /**
   * Get like count for a resource using denormalized counter
   * O(1) read instead of O(n) COUNT aggregation
   */
  async getLikeCount(resourceType: LikeableResourceType, resourceId: number) {
    if (resourceType === 'POST') {
      const post = await this.prisma.post.findUnique({
        where: { id: resourceId },
        select: { likeCount: true },
      });
      return post?.likeCount ?? 0;
    } else if (resourceType === 'COMMENT') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: resourceId },
        select: { likeCount: true },
      });
      return comment?.likeCount ?? 0;
    }
    // For future resource types (VIDEO, ARTICLE) when denormalization is added
    throw new BadRequestException(
      'Like count not yet supported for this resource type',
    );
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
   * Validate that the resource exists (post, video, article, etc.)
   */
  private async validateResourceExists(
    resourceType: LikeableResourceType,
    resourceId: number,
  ) {
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
      case 'COMMENT': {
        const comment = await this.prisma.comment.findUnique({
          where: { id: resourceId },
        });
        if (!comment || comment.deleted) {
          throw new NotFoundException('Comment not found');
        }
        break;
      }
      // case 'VIDEO': {
      //   // TODO: Implement when video model is added
      //   throw new BadRequestException('Video likes not yet implemented');
      // }
      // case 'ARTICLE': {
      //   // TODO: Implement when article model is added
      //   throw new BadRequestException('Article likes not yet implemented');
      // }
      default:
        throw new BadRequestException('Invalid resource type');
    }
  }
}
