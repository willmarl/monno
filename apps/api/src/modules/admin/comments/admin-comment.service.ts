import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CommentSearchDto } from '../../comments/dto/search-comment.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { UpdateCommentDto } from '../../comments/dto/update-comment.dto';
import { AdminService } from '../admin.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { normalizeBulkIds } from 'src/common/admin/bulk-ids';

const DEFAULT_COMMENT_SELECT = {
  id: true,
  content: true,
  resourceType: true,
  resourceId: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};

@Injectable()
export class AdminCommentService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  /**
   * Get single comment by ID (including deleted comments)
   */
  async findById(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: DEFAULT_COMMENT_SELECT,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  /**
   * Search all comments with offset pagination (including deleted comments)
   * Supports filtering by text search, deleted status, and resource type
   */
  async search(searchDto: CommentSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    // Filter out resourceType from search fields (enum can't use contains)
    const textSearchFields = searchFields.filter((f) => f !== 'resourceType');

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: textSearchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (searchDto.deleted !== undefined) {
      filterConditions.push({ deleted: searchDto.deleted });
    }

    if (searchDto.resourceType) {
      filterConditions.push({ resourceType: searchDto.resourceType });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.comment,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_COMMENT_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async update(commentId: number, data: UpdateCommentDto, adminId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('COMMENT not found');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data,
      select: DEFAULT_COMMENT_SELECT,
    });

    // Log the update
    await this.adminService.log({
      adminId,
      action: 'COMMENT_UPDATED',
      resource: 'COMMENT',
      resourceId: commentId.toString(),
      targetId: comment.userId,
      description: `Admin updated comment "${comment.content}"`,
    });

    return updated;
  }

  /**
   * Delete any comment (soft delete)
   */
  async delete(commentId: number, adminId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        content: true,
        creator: { select: { id: true } },
        deleted: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.deleted) {
      throw new AlreadyDeletedException('Comment was already deleted');
    }

    const deleted = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_COMMENT_SELECT,
    });

    // Log the deletion
    await this.adminService.log({
      adminId,
      action: 'COMMENT_DELETED',
      resource: 'COMMENT',
      resourceId: commentId.toString(),
      targetId: comment.creator.id,
      description: `Admin deleted comment "${comment.content}"`,
    });

    return deleted;
  }

  /**
   * Restore a deleted comment
   */
  async restore(commentId: number, adminId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        content: true,
        creator: { select: { id: true } },
        deleted: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const restored = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: false, deletedAt: null },
      select: DEFAULT_COMMENT_SELECT,
    });

    // Log the restoration
    await this.adminService.log({
      adminId,
      action: 'COMMENT_RESTORED',
      resource: 'COMMENT',
      resourceId: commentId.toString(),
      targetId: comment.creator.id,
      description: `Admin restored comment "${comment.content}"`,
    });

    return restored;
  }

  async bulkDelete(ids: number[], adminId: number) {
    const uniqueIds = normalizeBulkIds(ids);
    if (uniqueIds.length === 0) {
      return { affected: 0, skipped: 0 };
    }

    const result = await this.prisma.comment.updateMany({
      where: { id: { in: uniqueIds }, deleted: false },
      data: { deleted: true, deletedAt: new Date() },
    });

    if (result.count > 0) {
      await this.adminService.log({
        adminId,
        action: 'COMMENTS_BULK_DELETED',
        resource: 'COMMENT',
        description: `Admin bulk soft-deleted ${result.count} comment(s)`,
        changes: { ids: uniqueIds, affected: result.count },
      });
    }

    return {
      affected: result.count,
      skipped: uniqueIds.length - result.count,
    };
  }

  async bulkRestore(ids: number[], adminId: number) {
    const uniqueIds = normalizeBulkIds(ids);
    if (uniqueIds.length === 0) {
      return { affected: 0, skipped: 0 };
    }

    const result = await this.prisma.comment.updateMany({
      where: { id: { in: uniqueIds }, deleted: true },
      data: { deleted: false, deletedAt: null },
    });

    if (result.count > 0) {
      await this.adminService.log({
        adminId,
        action: 'COMMENTS_BULK_RESTORED',
        resource: 'COMMENT',
        description: `Admin bulk restored ${result.count} comment(s)`,
        changes: { ids: uniqueIds, affected: result.count },
      });
    }

    return {
      affected: result.count,
      skipped: uniqueIds.length - result.count,
    };
  }
}
