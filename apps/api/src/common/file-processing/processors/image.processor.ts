import { FileProcessor } from '../file-processor.interface';
import { StorageBackend } from '../storage-backend.interface';
import sharp from 'sharp';

export class ImageProcessor implements FileProcessor {
  private readonly supportedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  canHandle(mimeType: string): Promise<boolean> {
    return Promise.resolve(this.supportedMimeTypes.includes(mimeType));
  }

  async process(
    file: any,
    fileType: string,
    userId: number,
    storageBackend: StorageBackend,
  ): Promise<string> {
    const filename = `${userId}-${Date.now()}.jpg`; // Convert to JPG for consistency

    // Process image: resize to 512x512 and compress
    const processedBuffer = await sharp(file.buffer)
      .resize(512, 512, {
        fit: 'cover', // Crop to fill 512x512
        position: 'center',
      })
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toBuffer();

    // Save to storage backend (local or S3)
    return await storageBackend.saveFile(processedBuffer, fileType, filename);
  }
}
