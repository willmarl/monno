import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  ResourceType,
} from 'src/generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { PreferencesService } from '../users/preferences.service';
import { QueueService } from '../queue/queue.service';
import { LogoService } from '../../common/logo/logo.service';
import { engagementNotificationEmailTemplate } from '../../common/email-templates/EngagementNotification';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import {
  isNotifiableResourceType,
  type NotifiableResourceType,
} from 'src/common/types/resource.types';

const ACTOR_SELECT = {
  id: true,
  username: true,
  avatarPath: true,
} as const;

type NotifiableResourceConfig = {
  model: keyof PrismaService;
  /** Field that holds the owner user id */
  ownerField: 'creatorId' | 'userId';
  label: string;
  /** Public detail path prefix; omit for nested types (e.g. COMMENT) */
  pathPrefix?: string;
};

/**
 * Teach NotificationsService about a resource by adding it to
 * NOTIFIABLE_RESOURCES + this map (same DX as LIKEABLE_RESOURCE_CONFIG).
 */
const NOTIFIABLE_RESOURCE_CONFIG: Record<
  NotifiableResourceType,
  NotifiableResourceConfig
> = {
  POST: {
    model: 'post',
    ownerField: 'creatorId',
    label: 'post',
    pathPrefix: '/post',
  },
  ARTICLE: {
    model: 'article',
    ownerField: 'creatorId',
    label: 'article',
    pathPrefix: '/article',
  },
  COLLECTION: {
    model: 'collection',
    ownerField: 'creatorId',
    label: 'collection',
    pathPrefix: '/collection',
  },
  COMMENT: {
    model: 'comment',
    ownerField: 'userId',
    label: 'comment',
  },
};

export type CreateNotificationInput = {
  type: NotificationType;
  actorId: number;
  resourceType: ResourceType;
  resourceId: number;
  /** When omitted, resolved from the resource owner */
  recipientId?: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly preferencesService: PreferencesService,
    private readonly queueService: QueueService,
    private readonly logoService: LogoService,
  ) {}

  async findForUser(userId: number, query: NotificationListQueryDto) {
    const where = { recipientId: userId };
    return offsetPaginate({
      model: this.prisma.notification,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          type: true,
          resourceType: true,
          resourceId: true,
          message: true,
          readAt: true,
          createdAt: true,
          actor: { select: ACTOR_SELECT },
        },
      },
      countQuery: { where },
    });
  }

  async unreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: number, dto: MarkNotificationsReadDto) {
    const now = new Date();

    if (dto.all) {
      const result = await this.prisma.notification.updateMany({
        where: { recipientId: userId, readAt: null },
        data: { readAt: now },
      });
      return { updated: result.count };
    }

    const ids = dto.ids ?? [];
    if (ids.length === 0) {
      return { updated: 0 };
    }

    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        id: { in: ids },
        readAt: null,
      },
      data: { readAt: now },
    });
    return { updated: result.count };
  }

  /**
   * Create an in-app notification (if prefs allow) and optionally email.
   * No-ops when resource is not on NOTIFIABLE_RESOURCES, actor is the
   * recipient, or prefs disable both channels.
   */
  async createIfAllowed(input: CreateNotificationInput) {
    try {
      if (!isNotifiableResourceType(input.resourceType)) {
        return null;
      }

      const recipientId =
        input.recipientId ??
        (await this.resolveOwnerId(input.resourceType, input.resourceId));

      if (recipientId == null || recipientId === input.actorId) {
        return null;
      }

      const prefs = await this.preferencesService.getOrCreate(recipientId);
      const inAppOn =
        input.type === NotificationType.COMMENT
          ? prefs.notifyInAppComments
          : prefs.notifyInAppLikes;
      const emailOn =
        input.type === NotificationType.COMMENT
          ? prefs.notifyEmailComments
          : prefs.notifyEmailLikes;

      if (!inAppOn && !emailOn) {
        return null;
      }

      const [actor, recipient] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: input.actorId },
          select: { id: true, username: true },
        }),
        this.prisma.user.findUnique({
          where: { id: recipientId },
          select: {
            id: true,
            username: true,
            email: true,
            isEmailVerified: true,
          },
        }),
      ]);

      if (!actor || !recipient) {
        return null;
      }

      const targetLabel = this.resourceLabel(input.resourceType);
      const actionLabel =
        input.type === NotificationType.COMMENT ? 'commented on' : 'liked';
      const message = `${actor.username} ${actionLabel} your ${targetLabel}`;
      const link = await this.resolveLinkTarget(
        input.resourceType,
        input.resourceId,
      );

      let notification: {
        id: number;
        type: NotificationType;
        resourceType: ResourceType;
        resourceId: number;
        message: string | null;
        readAt: Date | null;
        createdAt: Date;
        actor: {
          id: number;
          username: string;
          avatarPath: string | null;
        } | null;
      } | null = null;
      if (inAppOn) {
        notification = await this.prisma.notification.create({
          data: {
            recipientId,
            actorId: input.actorId,
            type: input.type,
            resourceType: link.resourceType,
            resourceId: link.resourceId,
            message,
          },
          select: {
            id: true,
            type: true,
            resourceType: true,
            resourceId: true,
            message: true,
            readAt: true,
            createdAt: true,
            actor: { select: ACTOR_SELECT },
          },
        });
      }

      if (emailOn && recipient.email && recipient.isEmailVerified) {
        const targetUrl = this.targetUrl(link.resourceType, link.resourceId);
        const logoUrl = this.logoService.getLogoUrl();
        const html = engagementNotificationEmailTemplate({
          recipientName: recipient.username,
          actorName: actor.username,
          actionLabel,
          targetLabel,
          targetUrl,
          logoUrl,
        });
        const subject =
          input.type === NotificationType.COMMENT
            ? `${actor.username} commented on your ${targetLabel}`
            : `${actor.username} liked your ${targetLabel}`;

        await this.queueService.enqueueEmail(
          recipient.email,
          subject,
          html,
          'engagement-notification',
        );
      }

      return notification;
    } catch (err) {
      this.logger.warn(
        `Failed to create notification: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  private async resolveLinkTarget(
    resourceType: ResourceType,
    resourceId: number,
  ): Promise<{ resourceType: ResourceType; resourceId: number }> {
    if (resourceType !== ResourceType.COMMENT) {
      return { resourceType, resourceId };
    }

    let currentType: ResourceType = resourceType;
    let currentId = resourceId;
    for (let i = 0; i < 5; i++) {
      if (currentType !== ResourceType.COMMENT) break;
      const row = await this.prisma.comment.findFirst({
        where: { id: currentId, deleted: false },
        select: { resourceType: true, resourceId: true },
      });
      if (!row) break;
      currentType = row.resourceType;
      currentId = row.resourceId;
    }

    return { resourceType: currentType, resourceId: currentId };
  }

  private async resolveOwnerId(
    resourceType: NotifiableResourceType,
    resourceId: number,
  ): Promise<number | null> {
    const config = NOTIFIABLE_RESOURCE_CONFIG[resourceType];
    if (!config) return null;

    const delegate = this.prisma[config.model] as any;
    const row = await delegate.findFirst({
      where: { id: resourceId, deleted: false },
      select: { [config.ownerField]: true },
    });
    return (row?.[config.ownerField] as number | undefined) ?? null;
  }

  private resourceLabel(resourceType: ResourceType): string {
    if (isNotifiableResourceType(resourceType)) {
      return NOTIFIABLE_RESOURCE_CONFIG[resourceType].label;
    }
    return 'content';
  }

  private targetUrl(resourceType: ResourceType, resourceId: number): string {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (isNotifiableResourceType(resourceType)) {
      const prefix = NOTIFIABLE_RESOURCE_CONFIG[resourceType].pathPrefix;
      if (prefix) return `${base}${prefix}/${resourceId}`;
    }
    return base;
  }
}
