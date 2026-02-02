import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdatePostDto } from '../posts/dto/update-post.dto';
import {
  PostSearchDto,
  PostSearchCursorDto,
} from '../posts/dto/search-post.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { AdminService } from './admin.service';

const DEFAULT_POST_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};

@Injectable()
export class AdminPostService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  /**
   * Get single post by ID (including deleted posts)
   */
  async findById(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: DEFAULT_POST_SELECT,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likeCount = await this.prisma.like.count({
      where: { resourceType: 'POST', resourceId: postId },
    });

    return {
      ...post,
      likeCount,
    };
  }

  /**
   * Search all posts with offset pagination (including deleted posts)
   * Supports filtering by text search (title, content)
   */
  async search(searchDto: PostSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (searchDto.deleted !== undefined) {
      filterConditions.push({ deleted: searchDto.deleted });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where },
    });

    // Add like counts to items
    const itemsWithLikes = await Promise.all(
      items.map(async (post: any) => ({
        ...post,
        likeCount: await this.prisma.like.count({
          where: { resourceType: 'POST', resourceId: post.id },
        }),
      })),
    );

    return {
      items: itemsWithLikes,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  /**
   * Search all posts with cursor pagination (including deleted posts)
   * Supports filtering by text search (title, content)
   */
  async searchCursor(searchDto: PostSearchCursorDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (searchDto.deleted !== undefined) {
      filterConditions.push({ deleted: searchDto.deleted });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      cursor: searchDto.cursor,
      query: {
        where,
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
    });

    // Add like counts to items
    const itemsWithLikes = await Promise.all(
      items.map(async (post: any) => ({
        ...post,
        likeCount: await this.prisma.like.count({
          where: { resourceType: 'POST', resourceId: post.id },
        }),
      })),
    );

    return {
      items: itemsWithLikes,
      nextCursor,
    };
  }

  /**
   * Update any post (admin can edit any post)
   */
  async update(postId: number, data: UpdatePostDto, adminId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data,
      select: DEFAULT_POST_SELECT,
    });

    // Log the update
    await this.adminService.log({
      adminId,
      action: 'POST_UPDATED',
      resource: 'POST',
      resourceId: postId.toString(),
      targetId: post.creatorId,
      description: `Admin updated post "${post.title}"`,
    });

    const likeCount = await this.prisma.like.count({
      where: { resourceType: 'POST', resourceId: postId },
    });

    return {
      ...updated,
      likeCount,
    };
  }

  /**
   * Delete any post (soft delete)
   */
  async delete(postId: number, adminId: number, reason?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, creatorId: true, deleted: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const deleted = await this.prisma.post.update({
      where: { id: postId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_POST_SELECT,
    });

    // Log the deletion
    await this.adminService.log({
      adminId,
      action: 'POST_DELETED',
      resource: 'POST',
      resourceId: postId.toString(),
      targetId: post.creatorId,
      description: `Admin deleted post "${post.title}"`,
    });

    const likeCount = await this.prisma.like.count({
      where: { resourceType: 'POST', resourceId: postId },
    });

    return {
      ...deleted,
      likeCount,
    };
  }

  /**
   * Restore a deleted post
   */
  async restore(postId: number, adminId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, creatorId: true, deleted: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const restored = await this.prisma.post.update({
      where: { id: postId },
      data: { deleted: false, deletedAt: null },
      select: DEFAULT_POST_SELECT,
    });

    // Log the restoration
    await this.adminService.log({
      adminId,
      action: 'POST_RESTORED',
      resource: 'POST',
      resourceId: postId.toString(),
      targetId: post.creatorId,
      description: `Admin restored post "${post.title}"`,
    });

    const likeCount = await this.prisma.like.count({
      where: { resourceType: 'POST', resourceId: postId },
    });

    return {
      ...restored,
      likeCount,
    };
  }
}
