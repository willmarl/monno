import { StorageBackend } from '../storage-backend.interface';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';

export class S3StorageBackend implements StorageBackend {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl: string;
  private keyPrefix: string;

  constructor() {
    // Validate required S3 credentials
    const requiredEnvs = ['S3_KEY', 'S3_SECRET', 'S3_BUCKET'];
    const missing = requiredEnvs.filter((env) => !process.env[env]);

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing S3 configuration: ${missing.join(', ')}. Set STORAGE_BACKEND=local or configure S3 env vars.`,
      );
    }

    this.bucket = process.env.S3_BUCKET!;
    this.region = process.env.S3_REGION || 'auto';
    this.publicUrl =
      process.env.S3_PUBLIC_URL || `https://${this.bucket}.s3.amazonaws.com`;
    // Optional prefix for S3 keys (e.g., 'nextnest_uploads' to organize files in a folder)
    this.keyPrefix = (process.env.S3_KEY_PREFIX || '').replace(/\/$/, ''); // Remove trailing slash

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true, // Required for Oracle Object Storage and some other S3-compatible services
      credentials: {
        accessKeyId: process.env.S3_KEY!,
        secretAccessKey: process.env.S3_SECRET!,
      },
    });
  }

  async saveFile(
    buffer: Buffer,
    fileType: string,
    filename: string,
  ): Promise<string> {
    // Construct S3 key (path in bucket) with optional prefix
    const key = this.keyPrefix
      ? `${this.keyPrefix}/${fileType}/${filename}`
      : `${fileType}/${filename}`;

    try {
      // Upload to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          // Optionally set content type based on file extension
          ContentType: this.getContentType(filename),
        }),
      );

      // Return full public URL for database storage
      // This way frontend can directly access the file from S3
      const publicUrl = `${this.publicUrl}/${key}`;
      return publicUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload to S3';
      throw new BadRequestException(`S3 upload failed: ${errorMessage}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      let key = filePath;

      // Extract key from URL if needed (e.g., https://bucket.s3.amazonaws.com/avatars/file.jpg -> avatars/file.jpg)
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Try to extract from publicUrl first (most reliable method)
        if (filePath.startsWith(this.publicUrl)) {
          key = filePath.substring(this.publicUrl.length);
          if (key.startsWith('/')) {
            key = key.slice(1);
          }
        } else {
          // Fallback: try URL parsing
          try {
            const url = new URL(filePath);
            key = url.pathname;
            // Remove leading slash
            if (key.startsWith('/')) {
              key = key.slice(1);
            }
            // Remove bucket name from key if it exists at the start
            // (Oracle Object Storage includes bucket in pathname)
            if (key.startsWith(`${this.bucket}/`)) {
              key = key.substring(`${this.bucket}/`.length);
            }
          } catch {
            // If URL parsing fails, continue with original filePath
          }
        }
      } else if (key.startsWith('/')) {
        key = key.slice(1);
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('S3 delete failed:', error);
      // Don't throw - deletion failures shouldn't break the app
    }
  }

  getPublicUrl(filePath: string): string {
    // Construct public URL for accessing the file
    const key = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Helper to determine MIME type from filename
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      pdf: 'application/pdf',
      txt: 'text/plain',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
