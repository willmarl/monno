import { Controller, Get, Res, Req } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FilesController {
  /**
   * Serve static files from the uploads directory
   * This endpoint is only used when STORAGE_BACKEND=local
   * For S3, files are served directly from the S3 URL
   * Supports nested paths like: /files/articles/images/filename.webp
   */
  @ApiExcludeEndpoint()
  @Get('*')
  serveFile(@Req() req: Request, @Res() res: Response): void {
    const uploadPath = process.env.LOCAL_UPLOAD_PATH || '/uploads';
    // Extract file path from URL, removing the /files prefix
    const filePath = req.path.replace(/^\/files\/?/, '');
    const fullPath = path.join(uploadPath, filePath);

    // Security: Prevent directory traversal attacks
    const normalizedPath = path.normalize(fullPath);
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
