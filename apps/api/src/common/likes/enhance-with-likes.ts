import { PrismaService } from '../../prisma.service';
import type { LikeableResourceType } from 'src/common/types/resource.types';

/**
 * Attaches `likedByMe` (and preserves the denormalized `likeCount`) to an array
 * of records that carry an `id`.
 *
 * - `likeCount`  → read directly from the record (O(1), denormalized)
 * - `likedByMe`  → one batched `findMany` for all ids (avoids N+1)
 */
export async function enhanceWithLikes(
  prisma: PrismaService,
  resourceType: LikeableResourceType,
  items: any[],
  currentUserId?: number,
): Promise<any[]> {
  if (!currentUserId || items.length === 0) {
    return items.map((item) => ({ ...item, likedByMe: false }));
  }

  const resourceIds = items.map((item) => item.id);

  const likes = await prisma.like.findMany({
    where: {
      userId: currentUserId,
      resourceType,
      resourceId: { in: resourceIds },
    },
    select: { resourceId: true },
  });

  const likedIds = new Set(likes.map((like) => like.resourceId));

  return items.map((item) => ({
    ...item,
    likedByMe: likedIds.has(item.id),
  }));
}
