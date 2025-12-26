/**
 * Storage Backend Interface
 * Implementations: LocalStorageBackend, S3StorageBackend, etc.
 *
 * This allows swapping between different storage providers
 * without changing file processing logic.
 */
export interface StorageBackend {
  /**
   * Save a file to storage
   * @param buffer - File buffer/content
   * @param fileType - Subdirectory (avatars, images, videos, etc)
   * @param filename - Filename to save as
   * @returns Path to access the file (relative or absolute URL)
   */
  saveFile(buffer: Buffer, fileType: string, filename: string): Promise<string>;

  /**
   * Delete a file from storage (optional)
   * @param filePath - Path returned from saveFile
   */
  deleteFile?(filePath: string): Promise<void>;

  /**
   * Get the public URL for accessing a file
   * @param filePath - Path returned from saveFile
   * @returns Public URL to access the file
   */
  getPublicUrl(filePath: string): string;
}
