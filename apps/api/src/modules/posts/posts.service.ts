import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { PostSearchDto, PostSearchCursorDto } from './dto/search-post.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { enhanceWithEngagement } from 'src/common/reactions/enhance-with-engagement';
import {
  publicVisibilityWhere,
  visibilityWhereForViewer,
  visibilityWhereForContentViewer,
  canViewPrivateContent,
} from 'src/common/visibility/visibility';

const DEFAULT_POST_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
  viewCount: true,
  likeCount: true,
  visibility: true,
};

// ============================================================
// ⚠️  PAGINATION NOTE
// This service has BOTH offset and cursor pagination for several
// endpoints (findByUserId, findLikedByUser). In general you should
// pick ONE pagination style per endpoint and stick with it.
// Having both is unusual and adds maintenance overhead.
// Consider removing whichever variant is not actively used in
// the frontend before this grows further.
// ============================================================

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePostDto, userId: number) {
    return this.prisma.post.create({
      data: {
        ...data,
        creatorId: userId,
      },
      select: DEFAULT_POST_SELECT,
    });
  }

  // # get all endpoint uses search. findAll is redundant as empty search gives same result
  //
  // async findAll(pag: PaginationDto) {
  //   const where = { deleted: false, creator: { status: 'ACTIVE' } };
  //   const { items, pageInfo, isRedirected } = await offsetPaginate({
  //     model: this.prisma.post,
  //     limit: pag.limit ?? 10,
  //     offset: pag.offset ?? 0,
  //     query: {
  //       where,
  //       orderBy: { createdAt: 'desc' } as const,
  //       select: DEFAULT_POST_SELECT,
  //     },
  //     countQuery: { where: where },
  //   });

  //   return {
  //     items,
  //     pageInfo,
  //     ...(isRedirected && { isRedirected: true }),
  //   };
  // }

  // async findAllCursor(pag: CursorPaginationDto) {
  //   const { cursor, limit } = pag;

  //   const { items, nextCursor } = await cursorPaginate({
  //     model: this.prisma.post,
  //     limit: limit ?? 10,
  //     cursor,
  //     query: {
  //       where: { deleted: false, creator: { status: 'ACTIVE' } },
  //       orderBy: { createdAt: 'desc' } as const,
  //       select: DEFAULT_POST_SELECT,
  //     },
  //   });
  //   return {
  //     items,
  //     nextCursor: nextCursor,
  //   };
  // }

  async findByUserId(
    userId: number,
    searchDto: PostSearchDto,
    viewerId?: number,
  ) {
    const searchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchDto.getSearchFields(),
      options: searchDto.getSearchOptions(),
    });
    const where = {
      creatorId: userId,
      deleted: false,
      creator: { status: 'ACTIVE' as const },
      ...visibilityWhereForViewer(userId, viewerId),
      ...searchWhere,
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy: searchDto.getOrderBy(),
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      items,
      viewerId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async findByUserIdCursor(
    userId: number,
    pag: CursorPaginationDto,
    viewerId?: number,
  ) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {
          creatorId: userId,
          deleted: false,
          creator: { status: 'ACTIVE' as const },
          ...visibilityWhereForViewer(userId, viewerId),
        },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_POST_SELECT,
      },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      items,
      viewerId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async findLikedByUser(
    userId: number,
    searchDto: PostSearchDto,
    viewerId?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const likes = await this.prisma.like.findMany({
      where: { userId, resourceType: 'POST' },
      select: { resourceId: true },
    });
    const likedIds = likes.map((like) => like.resourceId);

    if (likedIds.length === 0) {
      return {
        items: [],
        pageInfo: {
          totalItems: 0,
          total: 0,
          limit: searchDto.limit ?? 10,
          offset: searchDto.offset ?? 0,
          hasMore: false,
        },
      };
    }

    const searchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchDto.getSearchFields(),
      options: searchDto.getSearchOptions(),
    });

    // AND visibility + search so nested OR clauses do not clobber each other
    const where = {
      id: { in: likedIds },
      deleted: false,
      AND: [
        visibilityWhereForContentViewer(viewerId),
        searchWhere,
      ],
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy: searchDto.getOrderBy(),
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      items,
      viewerId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async findLikedByUserCursor(
    userId: number,
    pag: CursorPaginationDto,
    viewerId?: number,
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { cursor, limit } = pag;

    // Only posts this viewer can still see (private liked posts drop for non-creators)
    const likedPostVisibility = visibilityWhereForContentViewer(viewerId);

    // Get paginated likes using cursor pagination
    const likes = await this.prisma.like.findMany({
      where: {
        userId,
        resourceType: 'POST',
      },
      orderBy: { createdAt: 'desc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: (limit ?? 10) + 1, // +1 to determine if there's a next page
      select: { id: true, resourceId: true },
    });

    // Determine if there's a next page and get nextCursor
    const hasMore = likes.length > (limit ?? 10);
    const items = hasMore ? likes.slice(0, -1) : likes;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Get the actual posts
    const postIds = items.map((like) => like.resourceId);

    if (postIds.length === 0) {
      return {
        items: [],
        nextCursor: null,
      };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        id: { in: postIds },
        deleted: false,
        ...likedPostVisibility,
      },
      select: DEFAULT_POST_SELECT,
    });

    // Enhance with likes
    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      posts,
      viewerId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async findById(id: number, viewerId?: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: DEFAULT_POST_SELECT,
    });

    if (!post || post.deleted) {
      throw new NotFoundException('Post not found');
    }

    if (
      post.visibility === 'PRIVATE' &&
      !canViewPrivateContent(post.creator.id, viewerId)
    ) {
      throw new NotFoundException('Post not found');
    }

    const [enhanced] = await enhanceWithEngagement(
      this.prisma,
      'POST',
      [post],
      viewerId,
    );
    return enhanced;
  }

  update(id: number, data: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data,
      select: DEFAULT_POST_SELECT,
    });
  }

  async remove(id: number) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, deleted: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.deleted) {
      throw new AlreadyDeletedException('Post was already deleted');
    }

    // Soft delete the post
    await this.prisma.post.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  //--------------
  //   Search
  //--------------

  async searchAll(searchDto: PostSearchDto, currentUserId?: number) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const whereWithStatus = {
      ...where,
      deleted: false,
      creator: { status: 'ACTIVE' as const },
      ...publicVisibilityWhere(),
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: whereWithStatus,
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where: whereWithStatus },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async searchAllCursor(
    searchDto: PostSearchCursorDto,
    currentUserId?: number,
  ) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {
          ...where,
          deleted: false,
          creator: { status: 'ACTIVE' as const },
          ...publicVisibilityWhere(),
        },
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
    });

    const enhancedItems = await enhanceWithEngagement(
      this.prisma,
      'POST',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async searchSuggest(q: string, limit: number, currentUserId?: number) {
    if (!q) return [];

    const posts = await this.prisma.post.findMany({
      where: {
        deleted: false,
        creator: { status: 'ACTIVE' },
        ...publicVisibilityWhere(),
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_POST_SELECT,
      take: limit,
    });

    return enhanceWithEngagement(this.prisma, 'POST', posts, currentUserId);
  }

  /**
   * Get collections owned by userId that contain a specific post
   */
  async getCollectionsForPost(postId: number, userId: number) {
    const collections = await this.prisma.collectionItem.findMany({
      where: {
        resourceType: 'POST',
        resourceId: postId,
        deleted: false,
        collection: {
          deleted: false,
          creatorId: userId,
        },
      },
      select: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return collections.map((item) => item.collection);
  }
}
