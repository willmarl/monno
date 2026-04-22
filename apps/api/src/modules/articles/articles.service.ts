import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { MediaService } from '../media/media.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import {
  ArticleSearchDto,
  ArticleSearchCursorDto,
} from './dto/search-article.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { enhanceWithLikes } from 'src/common/likes/enhance-with-likes';
import { FilePresetName } from '../../common/file-processing/file-upload-presets';

const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
  likeCount: true,
  viewCount: true,
  media: {
    select: {
      id: true,
      original: true,
      thumbnail: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      isPrimary: true,
      createdAt: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};

const ARTICLE_MEDIA_LIMIT = 3;
const ARTICLE_MEDIA_PRESET: FilePresetName = 'mediaImage';
@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  async create(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        creatorId: userId,
      },
      select: DEFAULT_ARTICLE_SELECT,
    });
  }

  async findById(id: number, userId: number | undefined) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: DEFAULT_ARTICLE_SELECT,
    });

    if (!article || article.deleted) {
      throw new NotFoundException('Article not found');
    }

    const [enhanced] = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      [article],
      userId ?? undefined,
    );
    return enhanced;
  }

  async findAll(pag: PaginationDto, currentUserId?: number) {
    const where = { deleted: false, creator: { status: 'ACTIVE' } };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where: where },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async findAllCursor(pag: CursorPaginationDto, currentUserId?: number) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: { deleted: false, creator: { status: 'ACTIVE' } },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

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
      model: this.prisma.article,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
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
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {
          creatorId: userId,
          deleted: false,
          creator: { status: 'ACTIVE' },
        },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const totalCount = await this.prisma.like.count({
      where: { userId, resourceType: 'ARTICLE' },
    });

    const likes = await this.prisma.like.findMany({
      where: { userId, resourceType: 'ARTICLE' },
      orderBy: { createdAt: 'desc' },
      skip: pag.offset ?? 0,
      take: pag.limit ?? 10,
      select: { resourceId: true },
    });

    const articleIds = likes.map((like) => like.resourceId);

    if (articleIds.length === 0) {
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

    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds }, deleted: false },
      select: DEFAULT_ARTICLE_SELECT,
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      articles,
      currentUserId,
    );

    const limit = pag.limit ?? 10;
    const offset = pag.offset ?? 0;

    return {
      items: enhancedItems,
      pageInfo: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  }

  async findLikedByUserCursor(
    userId: number,
    pag: CursorPaginationDto,
    currentUserId?: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { cursor, limit } = pag;

    const likes = await this.prisma.like.findMany({
      where: { userId, resourceType: 'ARTICLE' },
      orderBy: { createdAt: 'desc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: (limit ?? 10) + 1,
      select: { id: true, resourceId: true },
    });

    const hasMore = likes.length > (limit ?? 10);
    const items = hasMore ? likes.slice(0, -1) : likes;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    const articleIds = items.map((like) => like.resourceId);

    if (articleIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds }, deleted: false },
      select: DEFAULT_ARTICLE_SELECT,
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      articles,
      currentUserId,
    );

    return { items: enhancedItems, nextCursor };
  }

  async update(id: number, data: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id } });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.article.update({
      where: { id },
      data,
      select: DEFAULT_ARTICLE_SELECT,
    });
  }

  // --- Media delegation ---

  async addMediaBatch(articleId: number, files: any[], userId: number) {
    return this.mediaService.addMediaBatch({
      resourceWhere: { articleId },
      files,
      userId,
      maxCount: ARTICLE_MEDIA_LIMIT,
      preset: ARTICLE_MEDIA_PRESET,
    });
  }

  async replaceMedia(
    articleId: number,
    mediaId: number,
    file: any,
    userId: number,
  ) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId) {
      throw new NotFoundException('Media not found');
    }
    return this.mediaService.replaceMedia(
      mediaId,
      file,
      userId,
      ARTICLE_MEDIA_PRESET,
    );
  }

  async removeMedia(articleId: number, mediaId: number) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId) {
      throw new NotFoundException('Media not found');
    }
    return this.mediaService.removeMedia(mediaId);
  }

  async setPrimary(articleId: number, mediaId: number) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId) {
      throw new NotFoundException('Media not found');
    }
    return this.mediaService.setPrimary({ articleId }, mediaId);
  }

  async reorderMedia(articleId: number, ids: number[]) {
    return this.mediaService.reorderMedia({ articleId }, ids);
  }

  async remove(id: number) {
    // Check if article exists
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, deleted: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.deleted) {
      throw new AlreadyDeletedException('Article was already deleted');
    }

    // Soft delete the article
    await this.prisma.article.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  async searchAll(searchDto: ArticleSearchDto, currentUserId?: number) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();
    const statuses = searchDto.getStatuses();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [
      { deleted: false },
      { creator: { status: 'ACTIVE' } },
    ];

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      AND: filterConditions,
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
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
    searchDto: ArticleSearchCursorDto,
    currentUserId?: number,
  ) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();
    const statuses = searchDto.getStatuses();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [
      { deleted: false },
      { creator: { status: 'ACTIVE' } },
    ];

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      AND: filterConditions,
    };

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where,
        orderBy,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });

    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      'ARTICLE',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      nextCursor,
    };
  }

  async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.article.findMany({
      where: {
        deleted: false,
        creator: { status: 'ACTIVE' },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_ARTICLE_SELECT,
      take: limit,
    });
  }

  async getCollectionsForArticle(id: number, userId: number) {
    const collections = await this.prisma.collectionItem.findMany({
      where: {
        resourceType: 'ARTICLE',
        resourceId: id,
        deleted: false,
        collection: {
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
