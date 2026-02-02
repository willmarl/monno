import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Toggle like for a resource (post, video, article, etc.)
   */
  async toggleLike(
    userId: number,
    resourceType: ResourceType,
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
      // Unlike (delete)
      await this.prisma.like.delete({
        where: {
          userId_resourceType_resourceId: { userId, resourceType, resourceId },
        },
      });
    } else {
      // Like (create)
      await this.prisma.like.create({
        data: {
          userId,
          resourceType,
          resourceId,
        },
      });
    }

    // Get updated like count
    const count = await this.prisma.like.count({
      where: { resourceType, resourceId },
    });

    return {
      liked: !existing,
      likeCount: count,
    };
  }

  /**
   * Get like count for a resource
   */
  async getLikeCount(resourceType: ResourceType, resourceId: number) {
    return this.prisma.like.count({
      where: { resourceType, resourceId },
    });
  }

  /**
   * Check if a user liked a resource
   */
  async isLikedByUser(
    userId: number,
    resourceType: ResourceType,
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
    resourceType: ResourceType,
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
