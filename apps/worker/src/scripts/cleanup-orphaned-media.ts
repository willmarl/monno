import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../prisma.service';
import { mediaCleanupResources } from './media-cleanup-resources';

// ---------------------------------------------------------------------------
// Storage deletion helpers (mirrors API's storage backends, no shared dep)
// ---------------------------------------------------------------------------

async function deleteFromS3(filePath: string): Promise<void> {
  // Lazy import — only loaded when STORAGE_BACKEND=s3
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  const publicUrl = process.env.S3_PUBLIC_URL || '';
  const bucket = process.env.S3_BUCKET!;

  let key = filePath;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    if (publicUrl && filePath.startsWith(publicUrl)) {
      key = filePath.substring(publicUrl.length);
      if (key.startsWith('/')) key = key.slice(1);
    } else {
      try {
        const url = new URL(filePath);
        key = url.pathname;
        if (key.startsWith('/')) key = key.slice(1);
        if (key.startsWith(`${bucket}/`)) key = key.substring(`${bucket}/`.length);
      } catch { /* continue with original */ }
    }
  } else if (key.startsWith('/')) {
    key = key.slice(1);
  }

  const s3 = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_KEY!,
      secretAccessKey: process.env.S3_SECRET!,
    },
  });

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.error(`[Media Cleanup] S3 delete failed for ${filePath}:`, error);
  }
}

function deleteFromLocal(filePath: string): void {
  const baseUploadPath = process.env.LOCAL_UPLOAD_PATH || '/uploads';

  let pathPart = filePath;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    try {
      pathPart = new URL(filePath).pathname;
    } catch { /* continue */ }
  }

  if (pathPart.startsWith('/files/')) {
    pathPart = pathPart.replace('/files/', '/');
  }

  const relativePath = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  const fullPath = path.join(baseUploadPath, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

async function deleteFromStorage(filePath: string): Promise<void> {
  if (!filePath) return;
  const backend = (process.env.STORAGE_BACKEND || 'local').toLowerCase();
  if (backend === 's3') {
    await deleteFromS3(filePath);
  } else {
    deleteFromLocal(filePath);
  }
}

// ---------------------------------------------------------------------------
// Generic cleanup runner — iterates mediaCleanupResources, no resource-specific code
// ---------------------------------------------------------------------------

export async function cleanupOrphanedMedia(): Promise<{
  itemsProcessed: number;
  filesDeleted: number;
  timestamp: Date;
}> {
  const retentionDays = Number(process.env.MEDIA_ORPHAN_RETENTION_DAYS ?? 30);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  let itemsProcessed = 0;
  let filesDeleted = 0;

  try {
    for (const resource of mediaCleanupResources) {
      const items = await resource.getOrphaned(cutoff);

      if (!items.length) {
        console.log(`[Media Cleanup] ${resource.label}: nothing to clean up`);
        continue;
      }

      console.log(`[Media Cleanup] ${resource.label}: found ${items.length} item(s) to clean up`);

      for (const item of items) {
        for (const media of item.media) {
          await deleteFromStorage(media.original);
          filesDeleted++;
          if (media.thumbnail) {
            await deleteFromStorage(media.thumbnail);
            filesDeleted++;
          }
        }

        await resource.deleteMediaRecords(item.id);
        itemsProcessed++;
      }
    }

    return { itemsProcessed, filesDeleted, timestamp: new Date() };
  } finally {
    await prisma.$disconnect();
  }
}
