import { PrismaService } from '../../prisma.service';
import type { LikeableResourceType } from 'src/common/types/resource.types';
import { enhanceWithLikes } from '../likes/enhance-with-likes';
import { enhanceWithReactions } from './enhance-with-reactions';

/**
 * Attach likedByMe + reactions in one pass (likes and reactions coexist).
 * REACTABLE_RESOURCES currently matches LIKEABLE_RESOURCES.
 */
export async function enhanceWithEngagement(
  prisma: PrismaService,
  resourceType: LikeableResourceType,
  items: any[],
  currentUserId?: number,
): Promise<any[]> {
  const withLikes = await enhanceWithLikes(
    prisma,
    resourceType,
    items,
    currentUserId,
  );
  return enhanceWithReactions(
    prisma,
    resourceType,
    withLikes,
    currentUserId,
  );
}
