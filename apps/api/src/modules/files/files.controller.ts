import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FilesController {
  /**
   * Serve static files from the uploads directory
   * This endpoint is only used when STORAGE_BACKEND=local
   * For S3, files are served directly from the S3 URL
   */
  @Get(':type/:filename')
  serveFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    const uploadPath = process.env.LOCAL_UPLOAD_PATH || '/uploads';
    const filePath = path.join(uploadPath, type, filename);

    // Security: Prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.normalize(uploadPath))) {
      res.status(403).send('Forbidden');
      return;
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      res.status(404).send('File not found');
      return;
    }

    // Serve the file
    res.sendFile(normalizedPath);
  }
}
