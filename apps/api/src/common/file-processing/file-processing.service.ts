import { Injectable, BadRequestException } from '@nestjs/common';
import { FileProcessor } from './file-processor.interface';
import { StorageBackend } from './storage-backend.interface';
import { ImageProcessor } from './processors/image.processor';
import { LocalStorageBackend } from './backends/local-storage.backend';
import { S3StorageBackend } from './backends/s3-storage.backend';
import { FileUploadConfig } from './file-upload-config.type';
import { FILE_PRESETS, FilePresetName } from './file-upload-presets';
import { uploadLocation } from './upload-location';

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
   * Resolve a preset name or inline config (with optional overrides) into
   * a concrete FileUploadConfig.
   */
  private resolveConfig(
    configOrPreset: FileUploadConfig | FilePresetName,
    overrides?: Partial<FileUploadConfig>,
  ): FileUploadConfig {
    const base =
      typeof configOrPreset === 'string'
        ? { ...FILE_PRESETS[configOrPreset] }
        : { ...configOrPreset };

    if (!overrides) return base;

    // Shallow merge top-level fields (maxSize, allowedMimeTypes, uploadPath)
    const merged: FileUploadConfig = {
      ...base,
      ...overrides,
    };

    // Deep-merge processingOptions so callers can override e.g. just quality
    const baseOpts = base.processingOptions;
    const overrideOpts = overrides.processingOptions;

    if (baseOpts || overrideOpts) {
      const mergedResize =
        baseOpts?.resize || overrideOpts?.resize
          ? ({ ...baseOpts?.resize, ...overrideOpts?.resize } as NonNullable<
              FileUploadConfig['processingOptions']
            >['resize'])
          : undefined;

      merged.processingOptions = {
        ...baseOpts,
        ...overrideOpts,
        ...(mergedResize ? { resize: mergedResize } : {}),
      };
    }

    return merged;
  }

  /**
   * Format a human-readable size string for error messages.
   */
  private formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  }

  /**
   * Process a file using the appropriate processor.
   *
   * @param file            - Uploaded file (multer-style with buffer, size, mimetype)
   * @param configOrPreset  - A preset name ('avatar', 'postImage', …) or a full FileUploadConfig
   * @param userId          - User ID for file organization / naming
   * @param overrides       - Optional partial overrides merged on top of the preset / config
   * @returns Path to the processed file
   *
   * @example
   *   // Use a preset
   *   await processFile(file, 'avatar', userId);
   *
   *   // Use a preset with overrides
   *   await processFile(file, 'avatar', userId, { maxSize: 5 * 1024 * 1024 });
   *
   *   // Use a fully custom config
   *   await processFile(file, { maxSize: 10_000_000, allowedMimeTypes: ['image/png'], uploadPath: 'banners' }, userId);
   */
  async processFile(
    file: any,
    configOrPreset: FileUploadConfig | FilePresetName,
    userId: number,
    overrides?: Partial<FileUploadConfig>,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const config = this.resolveConfig(configOrPreset, overrides);

    // --- Validate size ---
    if (file.size > config.maxSize) {
      throw new BadRequestException(
        `File size must be ${this.formatSize(config.maxSize)} or less`,
      );
    }

    // --- Validate MIME type ---
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      const allowed = config.allowedMimeTypes.join(', ');
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types: ${allowed}`,
      );
    }

    // --- Find processor ---
    const processor = await this.findProcessor(file.mimetype);

    if (!processor) {
      throw new BadRequestException(
        `No processor registered for file type: ${file.mimetype}`,
      );
    }

    // Normalize the upload path via uploadLocation()
    const normalizedPath = uploadLocation(config.uploadPath);

    // Process and save file using storage backend
    return await processor.process(
      file,
      normalizedPath,
      userId,
      this.storageBackend,
      config.processingOptions,
    );
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
