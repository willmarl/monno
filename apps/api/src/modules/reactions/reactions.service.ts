import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { ReactableResourceType } from 'src/common/types/resource.types';
import { isValidReactionEmoji } from 'src/common/reactions/allowed-emojis';
import {
  enhanceWithReactions,
  type ReactionSummary,
} from 'src/common/reactions/enhance-with-reactions';

type ResourceConfig = {
  model: keyof PrismaService;
  label: string;
};

const REACTABLE_RESOURCE_CONFIG: Record<
  ReactableResourceType,
  ResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
  ARTICLE: { model: 'article', label: 'Article' },
  COLLECTION: { model: 'collection', label: 'Collection' },
};

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Toggle one emoji reaction on a resource (add if missing, remove if present).
   * Coexists with binary likes — separate table/endpoint.
   */
  async toggleReaction(
    userId: number,
    resourceType: ReactableResourceType,
    resourceId: number,
    emoji: string,
  ): Promise<{ reacted: boolean; reactions: ReactionSummary[] }> {
    if (!isValidReactionEmoji(emoji)) {
      throw new BadRequestException('Emoji is not allowed');
    }

    await this.validateResourceExists(resourceType, resourceId, userId);

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_resourceType_resourceId_emoji: {
          userId,
          resourceType,
          resourceId,
          emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.reaction.delete({
        where: {
          userId_resourceType_resourceId_emoji: {
            userId,
            resourceType,
            resourceId,
            emoji,
          },
        },
      });
    } else {
      await this.prisma.reaction.create({
        data: { userId, resourceType, resourceId, emoji },
      });
    }

    const [summary] = await enhanceWithReactions(
      this.prisma,
      resourceType,
      [{ id: resourceId }],
      userId,
    );

    return {
      reacted: !existing,
      reactions: summary?.reactions ?? [],
    };
  }

  private async validateResourceExists(
    resourceType: ReactableResourceType,
    resourceId: number,
    userId: number,
  ) {
    const config = REACTABLE_RESOURCE_CONFIG[resourceType];
    if (!config) {
      throw new BadRequestException('Invalid resource type');
    }

    const delegate = this.prisma[config.model] as any;
    const record = await delegate.findUnique({ where: { id: resourceId } });

    if (!record || record.deleted) {
      throw new NotFoundException(`${config.label} not found`);
    }

    if (record.visibility === 'PRIVATE' && record.creatorId !== userId) {
      throw new NotFoundException(`${config.label} not found`);
    }
  }
}
