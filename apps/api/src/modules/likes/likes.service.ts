import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(userId: number, postId: number) {
    // ensure post exists (optional but nice)
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.deleted) {
      throw new NotFoundException('Post not found');
    }

    // check if like exists
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      // unlike (delete)
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });

      const count = await this.prisma.like.count({ where: { postId } });

      return {
        liked: false,
        likesCount: count,
      };
    } else {
      // like (create)
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      const count = await this.prisma.like.count({ where: { postId } });

      return {
        liked: true,
        likesCount: count,
      };
    }
  }
}
