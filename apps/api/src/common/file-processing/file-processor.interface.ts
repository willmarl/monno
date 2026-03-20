import { StorageBackend } from './storage-backend.interface';
import { ProcessingOptions } from './file-upload-config.type';

/**
 * Strategy interface for processing different file types
 * Implementations: ImageProcessor, VideoProcessor, DocumentProcessor, etc.
 */
export interface FileProcessor {
  /**
   * Process a file and save it to storage
   * @param file - Uploaded file with buffer and metadata
   * @param fileType - Subdirectory name (avatars, images, videos, etc)
   * @param userId - User ID for naming/organization
   * @param storageBackend - Storage backend to use for saving
   * @param options - Optional processing options (resize, format, quality, etc.)
   * @returns Path to the processed file
   */
  process(
    file: any,
    fileType: string,
    userId: number,
    storageBackend: StorageBackend,
    options?: ProcessingOptions,
  ): Promise<string>;

  /**
   * Check if this processor can handle the file
   * @param mimeType - MIME type of the file
   * @returns true if this processor can handle this MIME type
   */
  canHandle(mimeType: string): Promise<boolean>;
}
