import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { AdminService } from '../admin.service';
import { MediaService } from '../../media/media.service';
import { UpdateArticleDto } from '../../articles/dto/update-article.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
// import {
//   ArticleSearchDto,
//   ArticleSearchCursorDto,
// } from '../../articles/dto/search-article.dto';
import {
  ArticleSearchDto,
  ArticleSearchCursorDto,
  ArticleAvailability,
} from '../../articles/dto/search-article.dto';
import { FilePresetName } from '../../../common/file-processing/file-upload-presets';

const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
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
};

const ARTICLE_MEDIA_LIMIT = 3;
const ARTICLE_MEDIA_PRESET: FilePresetName = 'mediaImage';

@Injectable()
export class AdminArticleService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
    private mediaService: MediaService,
  ) {}

  async findById(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
      select: DEFAULT_ARTICLE_SELECT,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async findAll(pag: PaginationDto) {
    const where = {};
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

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async findAllCursor(pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {},
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }

  async update(adminId: number, id: number, data: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Log the update
    await this.adminService.log({
      adminId,
      action: 'ARTICLE_UPDATED',
      resource: 'ARTICLE',
      resourceId: id.toString(),
      targetId: article.creatorId,
      description: `Admin updated article "${article.title}"`,
    });

    return this.prisma.article.update({
      where: { id },
      data,
      select: DEFAULT_ARTICLE_SELECT,
    });
  }

  async remove(adminId: number, id: number, reason?: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
      select: { title: true, creatorId: true, deleted: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.deleted) {
      throw new AlreadyDeletedException('Article was already deleted');
    }

    await this.prisma.article.update({
      where: { id: id },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_ARTICLE_SELECT,
    });

    // Log the deletion
    await this.adminService.log({
      adminId,
      action: 'ARTICLE_DELETED',
      resource: 'ARTICLE',
      resourceId: id.toString(),
      targetId: article.creatorId,
      description: `Admin deleted article "${article.title}"`,
    });
  }

  async restore(adminId: number, id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.deleted) {
      throw new BadRequestException('Article is not deleted');
    }

    const restored = await this.prisma.article.update({
      where: { id: id },
      data: { deleted: false, deletedAt: null },
      select: DEFAULT_ARTICLE_SELECT,
    });

    // Log the restoration
    await this.adminService.log({
      adminId,
      action: 'ARTICLE_RESTORED',
      resource: 'ARTICLE',
      resourceId: id.toString(),
      targetId: article.creatorId,
      description: `Admin restored article "${article.title}"`,
    });

    return restored;
  }

  // --- Media ---

  async addMediaBatch(
    adminId: number,
    articleId: number,
    files: any[],
    userId: number,
  ) {
    await this.mediaService.addMediaBatch({
      resourceWhere: { articleId },
      files,
      userId,
      maxCount: ARTICLE_MEDIA_LIMIT,
      preset: ARTICLE_MEDIA_PRESET,
    });

    await this.adminService.log({
      adminId,
      action: 'ARTICLE_MEDIA_ADDED',
      resource: 'ARTICLE',
      resourceId: articleId.toString(),
      description: `Admin added ${files.length} media file(s) to article ${articleId}`,
    });
  }

  async replaceMedia(
    adminId: number,
    articleId: number,
    mediaId: number,
    file: any,
    userId: number,
  ) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId)
      throw new NotFoundException('Media not found');

    const result = await this.mediaService.replaceMedia(
      mediaId,
      file,
      userId,
      ARTICLE_MEDIA_PRESET,
    );

    await this.adminService.log({
      adminId,
      action: 'ARTICLE_MEDIA_REPLACED',
      resource: 'ARTICLE',
      resourceId: articleId.toString(),
      description: `Admin replaced media ${mediaId} on article ${articleId}`,
    });

    return result;
  }

  async removeMedia(adminId: number, articleId: number, mediaId: number) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId)
      throw new NotFoundException('Media not found');

    await this.mediaService.removeMedia(mediaId);

    await this.adminService.log({
      adminId,
      action: 'ARTICLE_MEDIA_REMOVED',
      resource: 'ARTICLE',
      resourceId: articleId.toString(),
      description: `Admin removed media ${mediaId} from article ${articleId}`,
    });
  }

  async setPrimary(adminId: number, articleId: number, mediaId: number) {
    const media = await this.mediaService.getMediaOrThrow(mediaId);
    if (media.articleId !== articleId)
      throw new NotFoundException('Media not found');

    const result = await this.mediaService.setPrimary({ articleId }, mediaId);

    await this.adminService.log({
      adminId,
      action: 'ARTICLE_MEDIA_PRIMARY_SET',
      resource: 'ARTICLE',
      resourceId: articleId.toString(),
      description: `Admin set media ${mediaId} as primary on article ${articleId}`,
    });

    return result;
  }

  async reorderMedia(adminId: number, articleId: number, ids: number[]) {
    await this.mediaService.reorderMedia({ articleId }, ids);

    await this.adminService.log({
      adminId,
      action: 'ARTICLE_MEDIA_REORDERED',
      resource: 'ARTICLE',
      resourceId: articleId.toString(),
      description: `Admin reordered media on article ${articleId}`,
    });
  }

  async searchAll(searchDto: ArticleSearchDto) {
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
    const filterConditions: any[] = [];

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }

    if (searchDto.availability === ArticleAvailability.ACTIVE) {
      filterConditions.push({ deleted: false });
    } else if (searchDto.availability === ArticleAvailability.DELETED) {
      filterConditions.push({ deleted: true });
    }
    // ArticleAvailability.ALL or undefined: no filter, show everything

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && { AND: filterConditions }),
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

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async searchAllCursor(searchDto: ArticleSearchCursorDto) {
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
    const filterConditions: any[] = [];

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }

    if (searchDto.availability === ArticleAvailability.ACTIVE) {
      filterConditions.push({ deleted: false });
    } else if (searchDto.availability === ArticleAvailability.DELETED) {
      filterConditions.push({ deleted: true });
    }
    // ArticleAvailability.ALL or undefined: no filter, show everything

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && { AND: filterConditions }),
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

    return {
      items,
      nextCursor,
    };
  }
}
