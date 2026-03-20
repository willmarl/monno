import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';

const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
    });
  }

  async findById(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: DEFAULT_ARTICLE_SELECT,
    });

    if (!article || article.deleted) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async findAll(pag: PaginationDto) {
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
        where: { deleted: false, creator: { status: 'ACTIVE' } },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }

  async findByUserId(userId: number, pag: PaginationDto) {
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

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async findByUserIdCursor(userId: number, pag: CursorPaginationDto) {
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

    return {
      items,
      nextCursor,
    };
  }

  update(id: number, data: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data,
    });
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
      return { message: 'Article was already deleted' };
    }

    // Soft delete the article
    await this.prisma.article.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
}
