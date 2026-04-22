import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../../prisma.service';
import { FileProcessingModule } from '../../common/file-processing/file-processing.module';

@Module({
  imports: [FileProcessingModule],
  providers: [MediaService, PrismaService],
  exports: [MediaService],
})
export class MediaModule {}
