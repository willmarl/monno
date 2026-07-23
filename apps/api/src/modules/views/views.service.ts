import { Injectable, NotFoundException } from '@nestjs/common';
import { ViewHandlerService } from '../../common/views/view-handler.service';
import { ViewStatsDto } from './dto/view-stats.dto';
import type { ViewableResourceType } from 'src/common/types/resource.types';
import { PrismaService } from '../../prisma.service';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { visibilityWhereForContentViewer } from 'src/common/visibility/visibility';
import { enhanceWithEngagement } from 'src/common/reactions/enhance-with-engagement';
import { HistoryQueryDto } from './dto/history-query.dto';

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
  likeCount: true,
  visibility: true,
};

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

@Injectable()
export class ViewsService {
  constructor(
    private viewHandler: ViewHandlerService,
    private prisma: PrismaService,
  ) {}

  /**
   * Record a view for a resource with rate limiting.
   * Authenticated users always upsert view history (even if count is skipped).
   */
  async recordView(
    resourceType: ViewableResourceType,
    resourceId: number,
    shouldCountView: boolean,
    userId?: number,
  ) {
    let recorded = false;

    if (shouldCountView) {
      await this.viewHandler.incrementViewCount(
        resourceType,
        resourceId,
        userId,
      );
      recorded = true;
    }

    if (userId) {
      // Count path already validates; when rate-limited, validate before history write
      if (!shouldCountView) {
        await this.ensureResourceExists(resourceType, resourceId);
      }
      await this.upsertHistory(userId, resourceType, resourceId);
    }

    const viewCount = await this.viewHandler.getViewCount(
      resourceType,
      resourceId,
    );

    return {
      recorded,
      viewCount,
    };
  }

  async getViewStats(
    resourceType: ViewableResourceType,
    resourceId: number,
  ): Promise<ViewStatsDto> {
    const totalViews = await this.viewHandler.getViewCount(
      resourceType,
      resourceId,
    );

    return {
      totalViews,
    };
  }

  async getViewCount(resourceType: ViewableResourceType, resourceId: number) {
    return this.viewHandler.getViewCount(resourceType, resourceId);
  }

  async findHistory(userId: number, queryDto: HistoryQueryDto) {
    const { resourceType } = queryDto;
    const limit = queryDto.limit ?? 10;
    const offset = queryDto.offset ?? 0;

    const historyRows = await this.prisma.viewHistory.findMany({
      where: {
        userId,
        resourceType,
        deleted: false,
      },
      orderBy: { viewedAt: 'desc' },
      select: { id: true, resourceId: true, viewedAt: true },
    });

    if (historyRows.length === 0) {
      return {
        items: [],
        pageInfo: {
          totalItems: 0,
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      };
    }

    const historyByResourceId = new Map(
      historyRows.map((row) => [row.resourceId, row]),
    );
    const ids = historyRows.map((row) => row.resourceId);

    const searchWhere = buildSearchWhere({
      query: queryDto.query ?? '',
      fields: ['title', 'content'],
    });

    let resources: any[];

    if (resourceType === 'POST') {
      resources = await this.prisma.post.findMany({
        where: {
          id: { in: ids },
          deleted: false,
          AND: [visibilityWhereForContentViewer(userId), searchWhere],
        },
        select: DEFAULT_POST_SELECT,
      });
      resources = await enhanceWithEngagement(this.prisma, 'POST', resources, userId);
    } else {
      resources = await this.prisma.article.findMany({
        where: {
          id: { in: ids },
          deleted: false,
          ...searchWhere,
        },
        select: DEFAULT_ARTICLE_SELECT,
      });
      resources = await enhanceWithEngagement(
        this.prisma,
        'ARTICLE',
        resources,
        userId,
      );
    }

    const sorted = resources
      .map((resource) => {
        const history = historyByResourceId.get(resource.id)!;
        return {
          ...resource,
          historyId: history.id,
          viewedAt: history.viewedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime(),
      );

    const total = sorted.length;
    const items = sorted.slice(offset, offset + limit);

    return {
      items,
      pageInfo: {
        totalItems: total,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async softDeleteOne(userId: number, historyId: number) {
    const row = await this.prisma.viewHistory.findFirst({
      where: { id: historyId, userId, deleted: false },
    });

    if (!row) {
      throw new NotFoundException('History entry not found');
    }

    await this.prisma.viewHistory.update({
      where: { id: historyId },
      data: { deleted: true, deletedAt: new Date() },
    });

    return { deleted: true };
  }

  async softClearAll(userId: number, resourceType?: ViewableResourceType) {
    const result = await this.prisma.viewHistory.updateMany({
      where: {
        userId,
        deleted: false,
        ...(resourceType ? { resourceType } : {}),
      },
      data: { deleted: true, deletedAt: new Date() },
    });

    return { cleared: result.count };
  }

  private async upsertHistory(
    userId: number,
    resourceType: ViewableResourceType,
    resourceId: number,
  ) {
    const now = new Date();
    await this.prisma.viewHistory.upsert({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
      create: {
        userId,
        resourceType,
        resourceId,
        viewedAt: now,
      },
      update: {
        viewedAt: now,
        deleted: false,
        deletedAt: null,
      },
    });
  }

  private async ensureResourceExists(
    resourceType: ViewableResourceType,
    resourceId: number,
  ) {
    if (resourceType === 'POST') {
      const post = await this.prisma.post.findUnique({
        where: { id: resourceId },
        select: { id: true, deleted: true },
      });
      if (!post || post.deleted) {
        throw new NotFoundException('Post not found');
      }
      return;
    }

    const article = await this.prisma.article.findUnique({
      where: { id: resourceId },
      select: { id: true, deleted: true },
    });
    if (!article || article.deleted) {
      throw new NotFoundException('Article not found');
    }
  }
}
