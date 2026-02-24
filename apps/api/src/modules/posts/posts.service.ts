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
import { CacheService } from '../../common/cache/cache.service';
import { CacheTTL, CacheKeys } from '../../common/cache/cache-keys';

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
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Enhance posts with like information - batch query version
   * Instead of N+1 queries, does just 2 queries total
   */
  private async enhancePostsWithLikes(posts: any[], currentUserId?: number) {
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((p) => p.id);

    // Single query to get all like counts
    const likeCounts = await this.prisma.like.groupBy({
      by: ['resourceId'],
      where: {
        resourceType: 'POST',
        resourceId: { in: postIds },
      },
      _count: true,
    });

    // Create a map of postId -> likeCount
    const likeCountMap = new Map<number, number>();
    likeCounts.forEach((lc) => {
      likeCountMap.set(lc.resourceId, lc._count);
    });

    // Single query to get current user's likes
    let likedPostIds = new Set<number>();
    if (currentUserId) {
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId: currentUserId,
          resourceType: 'POST',
          resourceId: { in: postIds },
        },
        select: { resourceId: true },
      });
      likedPostIds = new Set(userLikes.map((l) => l.resourceId));
    }

    // Map the data back to posts
    return posts.map((post) => ({
      ...post,
      likeCount: likeCountMap.get(post.id) ?? 0,
      likedByMe: likedPostIds.has(post.id),
    }));
  }

  create(data: CreatePostDto, userId: number) {
    return this.prisma.post.create({
      data: {
        ...data,
        creatorId: userId,
      },
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
    pag: PaginationDto,
    currentUserId?: number,
  ) {
    const where = {
      creatorId: userId,
      deleted: false,
      creator: { status: 'ACTIVE' },
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await this.enhancePostsWithLikes(
      items,
      currentUserId,
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
    currentUserId?: number,
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
          creator: { status: 'ACTIVE' },
        },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_POST_SELECT,
      },
    });

    const enhancedItems = await this.enhancePostsWithLikes(
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async findLikedByUser(
    userId: number,
    pag: PaginationDto,
    currentUserId?: number,
  ) {
    // Get total count of posts liked by the user
    const totalCount = await this.prisma.like.count({
      where: {
        userId,
        resourceType: 'POST',
      },
    });

    // Get paginated likes
    const likes = await this.prisma.like.findMany({
      where: {
        userId,
        resourceType: 'POST',
      },
      orderBy: { createdAt: 'desc' },
      skip: pag.offset ?? 0,
      take: pag.limit ?? 10,
      select: { resourceId: true },
    });

    // Get the actual posts
    const postIds = likes.map((like) => like.resourceId);

    if (postIds.length === 0) {
      return {
        items: [],
        pageInfo: {
          total: 0,
          limit: pag.limit ?? 10,
          offset: pag.offset ?? 0,
          hasMore: false,
        },
      };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        id: { in: postIds },
        deleted: false,
      },
      select: DEFAULT_POST_SELECT,
    });

    // Enhance with likes
    const enhancedItems = await this.enhancePostsWithLikes(
      posts,
      currentUserId,
    );

    const limit = pag.limit ?? 10;
    const offset = pag.offset ?? 0;
    const hasMore = offset + limit < totalCount;

    return {
      items: enhancedItems,
      pageInfo: {
        total: totalCount,
        limit,
        offset,
        hasMore,
      },
    };
  }

  async findLikedByUserCursor(
    userId: number,
    pag: CursorPaginationDto,
    currentUserId?: number,
  ) {
    const { cursor, limit } = pag;

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
      },
      select: DEFAULT_POST_SELECT,
    });

    // Enhance with likes
    const enhancedItems = await this.enhancePostsWithLikes(
      posts,
      currentUserId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async findById(id: number, userId: number | undefined) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: DEFAULT_POST_SELECT,
    });

    if (!post || post.deleted) {
      throw new NotFoundException('Post not found');
    }

    const [enhanced] = await this.enhancePostsWithLikes(
      [post],
      userId ?? undefined,
    );
    return enhanced;
  }

  update(id: number, data: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    // Soft delete the post
    return this.prisma.post.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  //--------------
  //   Search
  //--------------

  async searchAll(searchDto: PostSearchDto, currentUserId?: number) {
    // Create cache key based on pagination params (note: user doesn't affect feed cache)
    const cacheKey = CacheKeys.posts.searchFeed(
      searchDto.offset ?? 0,
      searchDto.limit ?? 10,
    );

    // Try to get from cache first
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

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
      creator: { status: 'ACTIVE' },
    };

    // Cache miss - fetch from database
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

    const enhancedItems = await this.enhancePostsWithLikes(
      items,
      currentUserId,
    );

    const result = {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };

    // Cache for 30 seconds
    await this.cache.set(cacheKey, result, CacheTTL.SHORT);

    return result;
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
        where: { ...where, deleted: false, creator: { status: 'ACTIVE' } },
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
    });

    const enhancedItems = await this.enhancePostsWithLikes(
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
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_POST_SELECT,
      take: limit,
    });

    return this.enhancePostsWithLikes(posts, currentUserId);
  }

  /**
   * Get all collections that contain a specific post for a user
   */
  async getCollectionsForPost(postId: number, userId: number) {
    const collections = await this.prisma.collectionItem.findMany({
      where: {
        resourceType: 'POST',
        resourceId: postId,
        deleted: false,
        collection: {
          creatorId: userId,
          deleted: false,
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
