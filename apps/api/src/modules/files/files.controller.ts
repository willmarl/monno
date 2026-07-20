import { Controller, Get, Res, Req } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import * as fs from 'fs';
import { resolveWithinRoot } from '../../common/file-processing/path-confinement';

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
    const resolved = resolveWithinRoot(uploadPath, filePath);

    if (!resolved) {
      res.status(403).send('Forbidden');
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).send('File not found');
      return;
    }

    res.sendFile(resolved);
  }
}
