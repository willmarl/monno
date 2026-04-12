import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import type { CommentableResourceType } from 'src/common/types/resource.types';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { enhanceWithLikes } from 'src/common/likes/enhance-with-likes';

type CommentableResourceConfig = { model: keyof PrismaService; label: string };

const COMMENTABLE_RESOURCE_CONFIG: Record<
  CommentableResourceType,
  CommentableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
};

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

    const [enhanced] = await enhanceWithLikes(
      this.prisma,
      'COMMENT',
      [comment],
      userId,
    );
    return enhanced;
  }

  /**
   * Get all comments for a resource (excluding soft-deleted)
   */
  async findByResource(
    resourceType: CommentableResourceType,
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

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'COMMENT',
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
    const [enhanced] = await enhanceWithLikes(
      this.prisma,
      'COMMENT',
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

    const [enhanced] = await enhanceWithLikes(
      this.prisma,
      'COMMENT',
      [updated],
      userId,
    );
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
      throw new AlreadyDeletedException('Comment was already deleted');
    }

    const deleted = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_COMMENT_SELECT,
    });

    const [enhanced] = await enhanceWithLikes(
      this.prisma,
      'COMMENT',
      [deleted],
      userId,
    );
    return enhanced;
  }

  /**
   * Validate that a resource exists based on type
   */
  private async validateResourceExists(
    resourceType: CommentableResourceType,
    resourceId: number,
  ): Promise<void> {
    const config = COMMENTABLE_RESOURCE_CONFIG[resourceType];
    const delegate = this.prisma[config.model] as any;
    const record = await delegate.findUnique({ where: { id: resourceId } });
    if (!record || record.deleted) {
      throw new NotFoundException(
        `${config.label} not found or has been deleted`,
      );
    }
  }
}
