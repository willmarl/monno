import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from '../../prisma.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService],
})
export class ArticlesModule {}
