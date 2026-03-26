import { PrismaService } from '../../prisma.service';
import type { LikeableResourceType } from 'src/common/types/resource.types';

/**
 * Attaches `likedByMe` (and ensures `likeCount` is present) to an array of
 * records that already carry a denormalized `likeCount` field.
 *
 * - `likeCount`  → read directly from the record (O(1), denormalized)
 * - `likedByMe`  → single `findUnique` per record only when `currentUserId` is set
 */
export async function enhanceWithLikes(
  prisma: PrismaService,
  resourceType: LikeableResourceType,
  items: any[],
  currentUserId?: number,
): Promise<any[]> {
  return Promise.all(
    items.map(async (item) => {
      let likedByMe = false;

      if (currentUserId) {
        const userLike = await prisma.like.findUnique({
          where: {
            userId_resourceType_resourceId: {
              userId: currentUserId,
              resourceType,
              resourceId: item.id,
            },
          },
        });
        likedByMe = !!userLike;
      }

      return { ...item, likedByMe };
    }),
  );
}
