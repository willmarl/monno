import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import type { ReportableResourceType } from 'src/common/types/resource.types';
import { canViewPrivateContent } from 'src/common/visibility/visibility';

const OPEN_STATUSES = ['OPEN', 'REVIEWING'] as const;

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: number, dto: CreateReportDto) {
    const ownership = await this.resolveTarget(dto.resourceType, dto.resourceId);

    if (ownership.creatorId === reporterId) {
      throw new ForbiddenException(
        dto.resourceType === 'USER'
          ? 'You cannot report yourself'
          : 'You cannot report your own content',
      );
    }

    if (
      ownership.visibility === 'PRIVATE' &&
      !canViewPrivateContent(ownership.creatorId, reporterId)
    ) {
      throw new NotFoundException('Resource not found');
    }

    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        status: { in: [...OPEN_STATUSES] },
      },
    });

    if (existing) {
      throw new ConflictException(
        dto.resourceType === 'USER'
          ? 'You already have an open report for this user'
          : 'You already have an open report for this content',
      );
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        reason: dto.reason,
        details: dto.details?.trim() || null,
      },
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
      },
    });
  }

  private async resolveTarget(
    resourceType: ReportableResourceType,
    resourceId: number,
  ): Promise<{ creatorId: number; visibility?: 'PUBLIC' | 'PRIVATE' }> {
    if (resourceType === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: resourceId },
        select: { id: true, deleted: true, status: true },
      });
      if (!user || user.deleted || user.status === 'DELETED') {
        throw new NotFoundException('User not found');
      }
      return { creatorId: user.id };
    }

    if (resourceType === 'POST') {
      const post = await this.prisma.post.findUnique({
        where: { id: resourceId },
        select: { creatorId: true, deleted: true, visibility: true },
      });
      if (!post || post.deleted) {
        throw new NotFoundException('Post not found');
      }
      return { creatorId: post.creatorId, visibility: post.visibility };
    }

    if (resourceType === 'ARTICLE') {
      const article = await this.prisma.article.findUnique({
        where: { id: resourceId },
        select: { creatorId: true, deleted: true },
      });
      if (!article || article.deleted) {
        throw new NotFoundException('Article not found');
      }
      return { creatorId: article.creatorId };
    }

    if (resourceType === 'COMMENT') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: resourceId },
        select: { userId: true, deleted: true },
      });
      if (!comment || comment.deleted) {
        throw new NotFoundException('Comment not found');
      }
      return { creatorId: comment.userId };
    }

    if (resourceType === 'COLLECTION') {
      const collection = await this.prisma.collection.findUnique({
        where: { id: resourceId },
        select: { creatorId: true, deleted: true, visibility: true },
      });
      if (!collection || collection.deleted) {
        throw new NotFoundException('Collection not found');
      }
      return {
        creatorId: collection.creatorId,
        visibility: collection.visibility,
      };
    }

    throw new BadRequestException('Unsupported resource type');
  }
}
