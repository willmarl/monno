import { FileProcessor } from '../file-processor.interface';
import { StorageBackend } from '../storage-backend.interface';
import { ProcessingOptions } from '../file-upload-config.type';
import { generateFilename } from '../generate-filename';
import { extensionForMime } from '../sniff-mime';

/**
 * Permanent fallback processor — saves any file as-is with no transformation.
 * Handles video, CSV, Excel, zip, bash scripts, Word docs, etc.
 *
 * Must be registered LAST in FileProcessingService.processors so dedicated
 * processors (ImageProcessor, etc.) get first pick. When a new file type needs
 * custom processing, add a dedicated processor before this one following
 * guide/how-to-do-file-upload.md.
 */
export class RawFileProcessor implements FileProcessor {
  canHandle(_mimeType: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  async process(
    file: any,
    fileType: string,
    userId: number,
    storageBackend: StorageBackend,
    _options?: ProcessingOptions,
  ): Promise<string> {
    const fromMime = file.mimetype ? extensionForMime(file.mimetype) : 'bin';
    const fromName = file.originalname?.split('.').pop();
    // Prefer server MIME extension; ignore client name unless mime unknown
    const ext =
      fromMime !== 'bin' ? fromMime : (fromName?.replace(/[^a-z0-9]/gi, '') || 'bin');
    const filename = generateFilename(userId, ext);
    return storageBackend.saveFile(file.buffer, fileType, filename);
  }
}
