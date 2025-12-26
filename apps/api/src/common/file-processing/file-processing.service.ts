import { Injectable, BadRequestException } from '@nestjs/common';
import { FileProcessor } from './file-processor.interface';
import { StorageBackend } from './storage-backend.interface';
import { ImageProcessor } from './processors/image.processor';
import { LocalStorageBackend } from './backends/local-storage.backend';
import { S3StorageBackend } from './backends/s3-storage.backend';

@Injectable()
export class FileProcessingService {
  private processors: FileProcessor[] = [new ImageProcessor()];
  private storageBackend: StorageBackend;

  constructor() {
    // Initialize storage backend based on ENV
    this.storageBackend = this.initializeStorageBackend();
  }

  /**
   * Initialize storage backend based on STORAGE_BACKEND env var
   */
  private initializeStorageBackend(): StorageBackend {
    const storageType = (process.env.STORAGE_BACKEND || 'local').toLowerCase();

    switch (storageType) {
      case 's3':
        return new S3StorageBackend();
      case 'local':
      default:
        return new LocalStorageBackend();
    }
  }

  /**
   * Process a file using the appropriate processor
   * @param file - Uploaded file
   * @param fileType - Type of file (avatars, images, videos, etc)
   * @param userId - User ID for file organization
   * @returns Path to processed file
   */
  async processFile(
    file: any,
    fileType: string,
    userId: number,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be 2MB or less');
    }

    // Find appropriate processor based on MIME type
    const processor = await this.findProcessor(file.mimetype);

    if (!processor) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported types: images (JPEG, PNG, WebP, GIF)`,
      );
    }

    // Process and save file using storage backend
    return await processor.process(file, fileType, userId, this.storageBackend);
  }

  /**
   * Find the appropriate processor for a given MIME type
   */
  private async findProcessor(mimeType: string): Promise<FileProcessor | null> {
    for (const processor of this.processors) {
      if (await processor.canHandle(mimeType)) {
        return processor;
      }
    }
    return null;
  }

  /**
   * Register a new file processor (useful for videos, documents, etc later)
   */
  registerProcessor(processor: FileProcessor): void {
    this.processors.push(processor);
  }

  /**
   * Delete a file from storage
   * @param filePath - Path returned from processFile (e.g., /files/avatars/user-123.jpg)
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }
    try {
      await this.storageBackend.deleteFile?.(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      // Don't throw - log and continue, old files can be cleaned up manually
    }
  }
}
