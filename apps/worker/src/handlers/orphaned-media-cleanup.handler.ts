import { Job } from 'bullmq';
import { cleanupOrphanedMedia } from '../scripts/cleanup-orphaned-media';

export async function orphanedMediaCleanupHandler(_job: Job): Promise<void> {
  console.log('[Media Cleanup] Starting orphaned media cleanup...');

  try {
    const result = await cleanupOrphanedMedia();

    console.log(
      `[Media Cleanup] Done at ${result.timestamp.toISOString()} — ` +
      `${result.itemsProcessed} item(s) processed, ${result.filesDeleted} file(s) deleted`,
    );
  } catch (error) {
    console.error('[Media Cleanup] Error during cleanup:', error);
    throw error;
  }
}
