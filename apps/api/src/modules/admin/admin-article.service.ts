import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AdminService } from './admin.service';
import { UpdateArticleDto } from '../articles/dto/update-article.dto';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
// import {
//   ArticleSearchDto,
//   ArticleSearchCursorDto,
// } from '../articles/dto/search-article.dto';
import { ArticleSearchDto } from '../articles/dto/search-article.dto';
import { ArticleSearchCursorDto } from '../articles/dto/search-article.dto';

const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
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

@Injectable()
export class AdminArticleService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
    private fileProcessing: FileProcessingService,
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

  async update(
    adminId: number,
    id: number,
    data: UpdateArticleDto,
    file?: any,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const userId = article.creatorId;

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current article to retrieve old image path
        const article = await this.prisma.article.findUnique({
          where: { id: id },
          select: { imagePath: true },
        });

        // Delete old image if it exists
        if (article?.imagePath) {
          await this.fileProcessing.deleteFile(article.imagePath);
        }

        const avatarPath = await this.fileProcessing.processFile(
          file,
          'postImage',
          userId,
        );
        data.imagePath = avatarPath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process image file';
        throw new BadRequestException(errorMessage);
      }
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

  async searchAll(searchDto: ArticleSearchDto) {
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
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: whereWithStatus,
        orderBy,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where: whereWithStatus },
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

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: { ...where },
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
