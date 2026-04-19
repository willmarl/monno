import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StorageBackend } from '../file-processing/storage-backend.interface';
import { LocalStorageBackend } from '../file-processing/backends/local-storage.backend';
import { S3StorageBackend } from '../file-processing/backends/s3-storage.backend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogoService implements OnModuleInit {
  private readonly logger = new Logger(LogoService.name);
  private logoUrl: string | undefined;
  private storageBackend: StorageBackend;

  constructor(private prisma: PrismaService) {
    this.storageBackend = this.initializeStorageBackend();
  }

  async onModuleInit() {
    await this.initializeLogo();
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
   * Compare two filenames for priority ordering
   * Priority: logo.png > logo.svg > logo-* > other images
   */
  private getFilePriority(filename: string): number {
    const lower = filename.toLowerCase();
    if (lower === 'logo.png') return 0;
    if (lower === 'logo.svg') return 1;
    if (lower.startsWith('logo-')) return 2;
    return 3;
  }

  private async initializeLogo(): Promise<void> {
    try {
      const logoDir = path.join(process.cwd(), 'logos');

      if (!fs.existsSync(logoDir)) {
        this.logger.debug('⚠️  No logo directory found at ' + logoDir);
        return;
      }

      // Read and filter image files
      const entries = fs.readdirSync(logoDir, { withFileTypes: true });
      const supportedExtensions = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
      const logoFiles: string[] = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).substring(1).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            logoFiles.push(entry.name);
          }
        }
      }

      if (logoFiles.length === 0) {
        this.logger.debug('⚠️  No image files found in ' + logoDir);
        return;
      }

      // Sort by priority (logo.png first, then logo.svg, then logo-*, then others)
      logoFiles.sort(
        (a, b) => this.getFilePriority(a) - this.getFilePriority(b),
      );
      const primaryLogoFile = logoFiles[0];
      const logoPath = path.join(logoDir, primaryLogoFile);

      // Read file buffer
      const fileBuffer = fs.readFileSync(logoPath);

      // Upload using storage backend (auto-detects local or S3)
      this.logoUrl = await this.storageBackend.saveFile(
        fileBuffer,
        'logos',
        primaryLogoFile,
      );

      this.logger.debug(`✓ Uploaded logo: ${primaryLogoFile}`);
      this.logger.debug(`Logo URL: ${this.logoUrl}`);

      // Store the URL in database for reference
      await this.prisma.setting.upsert({
        where: { key: 'EMAIL_LOGO_URL' },
        create: { key: 'EMAIL_LOGO_URL', value: this.logoUrl },
        update: { value: this.logoUrl },
      });

      this.logger.log(`✓ Email logo URL: ${this.logoUrl}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize logo: ${errorMessage}`);
      // Continue without logo if processing fails
    }
  }

  getLogoUrl(): string | undefined {
    return this.logoUrl;
  }
}
