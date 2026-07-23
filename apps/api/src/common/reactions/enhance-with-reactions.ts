import { PrismaService } from '../../prisma.service';
import type { ReactableResourceType } from 'src/common/types/resource.types';

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

/**
 * Attaches aggregated `reactions` to each item (Discord-style chip list).
 * One batched `findMany` for the page — no denormalized counters.
 */
export async function enhanceWithReactions(
  prisma: PrismaService,
  resourceType: ReactableResourceType,
  items: any[],
  currentUserId?: number,
): Promise<any[]> {
  if (items.length === 0) {
    return items;
  }

  const resourceIds = items.map((item) => item.id);
  const rows = await prisma.reaction.findMany({
    where: {
      resourceType,
      resourceId: { in: resourceIds },
    },
    select: { resourceId: true, emoji: true, userId: true },
  });

  const byResource = new Map<
    number,
    Map<string, { count: number; reactedByMe: boolean }>
  >();

  for (const row of rows) {
    let emojiMap = byResource.get(row.resourceId);
    if (!emojiMap) {
      emojiMap = new Map();
      byResource.set(row.resourceId, emojiMap);
    }
    const prev = emojiMap.get(row.emoji) ?? { count: 0, reactedByMe: false };
    emojiMap.set(row.emoji, {
      count: prev.count + 1,
      reactedByMe:
        prev.reactedByMe ||
        (!!currentUserId && row.userId === currentUserId),
    });
  }

  return items.map((item) => {
    const emojiMap = byResource.get(item.id);
    const reactions: ReactionSummary[] = emojiMap
      ? Array.from(emojiMap.entries())
          .map(([emoji, data]) => ({ emoji, ...data }))
          .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji))
      : [];
    return { ...item, reactions };
  });
}
