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
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};

const DEFAULT_POST_WITH_LIKES = {
  ...DEFAULT_POST_SELECT,
  _count: {
    select: { likes: true },
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
        select: {
          ...DEFAULT_POST_WITH_LIKES,
          likes: currentUserId ? { where: { userId: currentUserId } } : false,
        },
      },
      countQuery: { where },
    });

    return {
      items: items.map(({ _count, likes, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        likedByMe: currentUserId && likes ? likes.length > 0 : false,
      })),
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
        select: {
          ...DEFAULT_POST_WITH_LIKES,
          likes: currentUserId ? { where: { userId: currentUserId } } : false,
        },
      },
    });

    return {
      items: items.map(({ _count, likes, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        likedByMe: currentUserId && likes ? likes.length > 0 : false,
      })),
      nextCursor,
    };
  }

  async findById(id: number, userId: number | null) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        ...DEFAULT_POST_SELECT,
        _count: {
          select: {
            likes: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
      },
    });

    if (!post || post.deleted) {
      throw new NotFoundException('Post not found');
    }

    const { _count, likes, ...postData } = post;
    return {
      ...postData,
      likeCount: _count.likes,
      likedByMe: userId && likes ? likes.length > 0 : false,
    };
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
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.post,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: whereWithStatus,
        orderBy,
        select: {
          ...DEFAULT_POST_WITH_LIKES,
          likes: currentUserId ? { where: { userId: currentUserId } } : false,
        },
      },
      countQuery: { where: whereWithStatus },
    });

    return {
      items: items.map(({ _count, likes, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        likedByMe: currentUserId && likes ? likes.length > 0 : false,
      })),
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
        where: { ...where, deleted: false, creator: { status: 'ACTIVE' } },
        orderBy,
        select: {
          ...DEFAULT_POST_WITH_LIKES,
          likes: currentUserId ? { where: { userId: currentUserId } } : false,
        },
      },
    });

    return {
      items: items.map(({ _count, likes, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        likedByMe: currentUserId && likes ? likes.length > 0 : false,
      })),
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
      select: {
        ...DEFAULT_POST_WITH_LIKES,
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
      },
      take: limit,
    });

    return posts.map(({ _count, likes, ...post }) => ({
      ...post,
      likeCount: _count.likes,
      likedByMe: currentUserId && likes ? likes.length > 0 : false,
    }));
  }
}
