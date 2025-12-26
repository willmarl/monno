import { StorageBackend } from '../storage-backend.interface';
import * as fs from 'fs';
import * as path from 'path';

export class LocalStorageBackend implements StorageBackend {
  private baseUploadPath: string;
  private baseUrl: string;

  constructor() {
    this.baseUploadPath = process.env.LOCAL_UPLOAD_PATH || '/uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  async saveFile(
    buffer: Buffer,
    fileType: string,
    filename: string,
  ): Promise<string> {
    // Construct full file path
    const filepath = path.join(this.baseUploadPath, fileType, filename);

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filepath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(filepath, buffer);

    // Return full public URL for database storage
    // This way frontend can directly access the URL regardless of storage backend
    return `${this.baseUrl}/files/${fileType}/${filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    // Extract path from URL if needed (e.g., http://localhost:3000/files/avatars/user-123.jpg -> /files/avatars/user-123.jpg)
    let pathPart = filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const url = new URL(filePath);
        pathPart = url.pathname;
      } catch {
        // If URL parsing fails, try to use as-is
        pathPart = filePath;
      }
    }

    // Remove /files/ prefix if it exists (URL has /files/avatars but filesystem just has /avatars)
    if (pathPart.startsWith('/files/')) {
      pathPart = pathPart.replace('/files/', '/');
    }

    // Remove leading slash and construct full path
    const relativePath = pathPart.startsWith('/')
      ? pathPart.slice(1)
      : pathPart;
    const fullPath = path.join(this.baseUploadPath, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getPublicUrl(filePath: string): string {
    // For local storage, return relative path or full URL
    return `${this.baseUrl}${filePath}`;
  }
}
