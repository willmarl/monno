import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';

// this applies to findall only (not find by id)
// dont forget swagger docs
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
    const { items, pageInfo } = await offsetPaginate({
      prisma: this.prisma,
      model: 'post',
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { id: true, username: true },
          },
        },
      },
    });

    return {
      items,
      pageInfo,
    };
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: { id: true, username: true },
        },
      },
    });
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
}
