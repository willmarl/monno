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

const DEFAULT_POST_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePostDto, userId: number) {
    return this.prisma.post.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }

  async findAll(pag: PaginationDto) {
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        orderBy: { createdAt: 'desc' },
        select: DEFAULT_POST_SELECT,
      },
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
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        orderBy: { createdAt: 'desc' },
        select: DEFAULT_POST_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }

  async findByUserId(userId: number, pag: PaginationDto) {
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        select: DEFAULT_POST_SELECT,
      },
      countQuery: { where: { creatorId: userId } },
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
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        select: DEFAULT_POST_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }

  async findById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: DEFAULT_POST_SELECT,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  update(id: number, data: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }

  //--------------
  //   Search
  //--------------

  async searchAll(searchDto: PostSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

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

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async searchAllCursor(searchDto: PostSearchCursorDto) {
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
        where,
        orderBy,
        select: DEFAULT_POST_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }

  async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_POST_SELECT,
      take: limit,
    });
  }
}
