import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import type { ResourceType } from 'src/common/types/resource.types';

const DEFAULT_COMMENT_SELECT = {
  id: true,
  content: true,
  resourceType: true,
  resourceId: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  contentUpdatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enhance comments with like information
   */
  private async enhanceCommentsWithLikes(
    comments: any[],
    currentUserId?: number,
  ) {
    return Promise.all(
      comments.map(async (comment) => {
        let likedByMe = false;
        if (currentUserId) {
          const userLike = await this.prisma.like.findUnique({
            where: {
              userId_resourceType_resourceId: {
                userId: currentUserId,
                resourceType: 'COMMENT',
                resourceId: comment.id,
              },
            },
          });
          likedByMe = !!userLike;
        }

        return {
          ...comment,
          likedByMe,
        };
      }),
    );
  }

  /**
   * Create a comment on a resource (post, video, article, or another comment)
   */
  async create(userId: number, data: CreateCommentDto) {
    // Validate that the resource exists
    await this.validateResourceExists(data.resourceType, data.resourceId);

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        ...data,
      },
      select: DEFAULT_COMMENT_SELECT,
    });

    const [enhanced] = await this.enhanceCommentsWithLikes([comment], userId);
    return enhanced;
  }

  /**
   * Get all comments for a resource (excluding soft-deleted)
   */
  async findByResource(
    resourceType: ResourceType,
    resourceId: number,
    pag: PaginationDto,
    currentUserId?: number,
  ) {
    const where = { resourceType, resourceId, deleted: false };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.comment,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_COMMENT_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await this.enhanceCommentsWithLikes(
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  /**
   * Get a specific comment by ID (excluding soft-deleted)
   */
  async findOne(commentId: number, currentUserId?: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        ...DEFAULT_COMMENT_SELECT,
        deleted: true,
      },
    });

    if (!comment || comment.deleted) {
      throw new NotFoundException('Comment not found');
    }

    // Remove the deleted flag from response
    const { deleted, ...result } = comment;
    const [enhanced] = await this.enhanceCommentsWithLikes(
      [result],
      currentUserId,
    );
    return enhanced;
  }

  /**
   * Update a comment (only creator or admin)
   */
  async update(userId: number, commentId: number, data: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deleted) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }

    // Only update contentUpdatedAt if content is being changed
    const updateData = { ...data };
    if (data.content !== undefined) {
      updateData['contentUpdatedAt'] = new Date();
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      select: DEFAULT_COMMENT_SELECT,
    });

    const [enhanced] = await this.enhanceCommentsWithLikes([updated], userId);
    return enhanced;
  }

  /**
   * Soft delete a comment (only creator or admin)
   */
  async remove(userId: number, commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    if (comment.deleted) {
      return { message: 'Comment was already deleted' };
    }

    const deleted = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_COMMENT_SELECT,
    });

    const [enhanced] = await this.enhanceCommentsWithLikes([deleted], userId);
    return enhanced;
  }

  /**
   * Validate that a resource exists based on type
   */
  private async validateResourceExists(
    resourceType: ResourceType,
    resourceId: number,
  ): Promise<void> {
    switch (resourceType) {
      case 'POST': {
        const post = await this.prisma.post.findUnique({
          where: { id: resourceId },
        });
        if (!post || post.deleted) {
          throw new NotFoundException('Post not found or has been deleted');
        }
        break;
      }

      case 'COMMENT': {
        const comment = await this.prisma.comment.findUnique({
          where: { id: resourceId },
        });
        if (!comment || comment.deleted) {
          throw new NotFoundException('Comment not found or has been deleted');
        }
        break;
      }

      // case 'VIDEO':
      //   // TODO: Implement video validation when Video model is added
      //   break;

      // case 'ARTICLE':
      //   // TODO: Implement article validation when Article model is added
      //   break;

      default:
        throw new BadRequestException('Invalid resource type');
    }
  }
}
