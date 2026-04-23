import { FileProcessor } from '../file-processor.interface';
import { StorageBackend } from '../storage-backend.interface';
import { ProcessingOptions } from '../file-upload-config.type';
import { generateFilename } from '../generate-filename';
import sharp from 'sharp';

/** Default processing options when none are provided */
const DEFAULT_OPTIONS: Required<
  Pick<ProcessingOptions, 'resize' | 'format' | 'quality'>
> = {
  resize: { width: 512, height: 512, fit: 'cover' },
  format: 'jpeg',
  quality: 80,
};

/** All MIME types the image processor can handle */
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Map format name → file extension */
const FORMAT_EXTENSIONS: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export class ImageProcessor implements FileProcessor {
  canHandle(mimeType: string): Promise<boolean> {
    return Promise.resolve(SUPPORTED_MIME_TYPES.includes(mimeType));
  }

  async process(
    file: any,
    fileType: string,
    userId: number,
    storageBackend: StorageBackend,
    options?: ProcessingOptions,
  ): Promise<string> {
    const format = options?.format ?? DEFAULT_OPTIONS.format;
    const quality = options?.quality ?? DEFAULT_OPTIONS.quality;
    const resize = options?.resize ?? DEFAULT_OPTIONS.resize;

    const ext = FORMAT_EXTENSIONS[format] ?? 'jpg';
    const filename = generateFilename(userId, ext);

    // Build sharp pipeline
    let pipeline = sharp(file.buffer);

    if (resize) {
      pipeline = pipeline.resize(resize.width, resize.height, {
        fit: resize.fit ?? 'cover',
        position: 'center',
      });
    }

    // Apply output format
    switch (format) {
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
      default:
        pipeline = pipeline.jpeg({ quality });
        break;
    }

    const processedBuffer = await pipeline.toBuffer();

    // Save to storage backend (local or S3)
    return await storageBackend.saveFile(processedBuffer, fileType, filename);
  }
}
