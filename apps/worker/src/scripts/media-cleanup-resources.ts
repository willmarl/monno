import { prisma } from '../prisma.service';

export interface OrphanedItem {
  id: number;
  media: Array<{ id: number; original: string; thumbnail: string | null }>;
}

export interface MediaCleanupResource {
  label: string;
  getOrphaned(cutoff: Date): Promise<OrphanedItem[]>;
  deleteMediaRecords(resourceId: number): Promise<void>;
}

/**
 * Register every resource that owns media and needs orphaned-file cleanup here.
 * When a resource is soft-deleted and its deletedAt exceeds MEDIA_ORPHAN_RETENTION_DAYS,
 * the cleanup job will purge its media files from storage and remove the DB records.
 *
 * To add a new resource (e.g. Post):
 *   1. Add a postId FK to the Media model in schema.prisma
 *   2. Push a new entry below pointing at prisma.post / { postId: ... }
 *   3. Done — no changes needed in cleanup-orphaned-media.ts
 */
export const mediaCleanupResources: MediaCleanupResource[] = [
  {
    label: 'article',
    getOrphaned: (cutoff) =>
      (prisma as any).article.findMany({
        where: { deleted: true, deletedAt: { lt: cutoff }, media: { some: {} } },
        select: { id: true, media: { select: { id: true, original: true, thumbnail: true } } },
      }),
    deleteMediaRecords: (articleId) =>
      (prisma as any).media.deleteMany({ where: { articleId } }),
  },

  // Future example — uncomment when Post gets a media FK:
  // {
  //   label: 'post',
  //   getOrphaned: (cutoff) =>
  //     (prisma as any).post.findMany({
  //       where: { deleted: true, deletedAt: { lt: cutoff }, media: { some: {} } },
  //       select: { id: true, media: { select: { id: true, original: true, thumbnail: true } } },
  //     }),
  //   deleteMediaRecords: (postId) =>
  //     (prisma as any).media.deleteMany({ where: { postId } }),
  // },
];
