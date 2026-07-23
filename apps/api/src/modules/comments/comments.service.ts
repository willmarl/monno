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
import { enhanceWithEngagement } from 'src/common/reactions/enhance-with-engagement';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, ResourceType } from 'src/generated/prisma/client';

type CommentableResourceConfig = { model: keyof PrismaService; label: string };

type ThreadCreator = {
  id: number;
  username: string;
  avatarPath: string | null;
};

const COMMENTABLE_RESOURCE_CONFIG: Record<
  CommentableResourceType,
  CommentableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
  ARTICLE: { model: 'article', label: 'Article' },
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
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a comment on a resource (post, video, article, or another comment)
   */
  async create(userId: number, data: CreateCommentDto) {
    await this.validateResourceExists(data.resourceType, data.resourceId);

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        ...data,
      },
      select: DEFAULT_COMMENT_SELECT,
    });

    await this.notificationsService.createIfAllowed({
      type: NotificationType.COMMENT,
      actorId: userId,
      resourceType: data.resourceType as ResourceType,
      resourceId: data.resourceId,
    });

    const [enhanced] = await enhanceWithEngagement(
      this.prisma,
      'COMMENT',
      [comment],
      userId,
    );
    return {
      ...enhanced,
      replyCount: 0,
      creatorReply: null,
    };
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
        // Top-level: newest first. Replies under a comment: oldest first (thread read order).
        orderBy: {
          createdAt:
            resourceType === 'COMMENT' ? ('asc' as const) : ('desc' as const),
        },
        select: DEFAULT_COMMENT_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'COMMENT',
      items,
      currentUserId,
    );

    const withReplyMeta = await this.enhanceWithReplyMeta(
      enhancedItems,
      resourceType,
      resourceId,
    );

    return {
      items: withReplyMeta,
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

    const { deleted, ...result } = comment;
    const [enhanced] = await enhanceWithEngagement(
      this.prisma,
      'COMMENT',
      [result],
      currentUserId,
    );

    const [withReplyMeta] = await this.enhanceWithReplyMeta(
      [enhanced],
      enhanced.resourceType as CommentableResourceType,
      enhanced.resourceId,
    );
    return withReplyMeta;
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

    const updateData = { ...data };
    if (data.content !== undefined) {
      updateData['contentUpdatedAt'] = new Date();
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      select: DEFAULT_COMMENT_SELECT,
    });

    const [enhanced] = await enhanceWithEngagement(
      this.prisma,
      'COMMENT',
      [updated],
      userId,
    );

    const [withReplyMeta] = await this.enhanceWithReplyMeta(
      [enhanced],
      enhanced.resourceType as CommentableResourceType,
      enhanced.resourceId,
    );
    return withReplyMeta;
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

    const [enhanced] = await enhanceWithEngagement(
      this.prisma,
      'COMMENT',
      [deleted],
      userId,
    );
    return {
      ...enhanced,
      replyCount: 0,
      creatorReply: null,
    };
  }

  /**
   * Attach replyCount + creatorReply (YouTube-style creator-replied preview).
   * creatorReply is the root post/article author when they replied under this comment.
   */
  private async enhanceWithReplyMeta<T extends { id: number }>(
    items: T[],
    resourceType: CommentableResourceType,
    resourceId: number,
  ): Promise<
    Array<T & { replyCount: number; creatorReply: ThreadCreator | null }>
  > {
    if (items.length === 0) return [];

    const commentIds = items.map((item) => item.id);
    const threadCreator = await this.resolveThreadCreator(
      resourceType,
      resourceId,
    );

    const [counts, creatorReplyParents] = await Promise.all([
      this.prisma.comment.groupBy({
        by: ['resourceId'],
        where: {
          resourceType: 'COMMENT',
          resourceId: { in: commentIds },
          deleted: false,
        },
        _count: { _all: true },
      }),
      threadCreator
        ? this.prisma.comment.findMany({
            where: {
              resourceType: 'COMMENT',
              resourceId: { in: commentIds },
              userId: threadCreator.id,
              deleted: false,
            },
            select: { resourceId: true },
            distinct: ['resourceId'],
          })
        : Promise.resolve([] as { resourceId: number }[]),
    ]);

    const countMap = new Map(
      counts.map((row) => [row.resourceId, row._count._all]),
    );
    const creatorRepliedIds = new Set(
      creatorReplyParents.map((row) => row.resourceId),
    );

    return items.map((item) => ({
      ...item,
      replyCount: countMap.get(item.id) ?? 0,
      creatorReply:
        threadCreator && creatorRepliedIds.has(item.id)
          ? {
              id: threadCreator.id,
              username: threadCreator.username,
              avatarPath: threadCreator.avatarPath,
            }
          : null,
    }));
  }

  /**
   * Root post/article creator for a comment thread (YouTube "channel owner").
   */
  private async resolveThreadCreator(
    resourceType: CommentableResourceType,
    resourceId: number,
  ): Promise<ThreadCreator | null> {
    if (resourceType === 'POST' || resourceType === 'ARTICLE') {
      const model = resourceType === 'POST' ? 'post' : 'article';
      const record = await (this.prisma[model] as any).findUnique({
        where: { id: resourceId },
        select: {
          creator: {
            select: { id: true, username: true, avatarPath: true },
          },
        },
      });
      return record?.creator ?? null;
    }

    if (resourceType === 'COMMENT') {
      const parent = await this.prisma.comment.findUnique({
        where: { id: resourceId },
        select: { resourceType: true, resourceId: true },
      });
      if (!parent) return null;
      if (
        parent.resourceType === 'POST' ||
        parent.resourceType === 'ARTICLE' ||
        parent.resourceType === 'COMMENT'
      ) {
        return this.resolveThreadCreator(
          parent.resourceType as CommentableResourceType,
          parent.resourceId,
        );
      }
    }

    return null;
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
