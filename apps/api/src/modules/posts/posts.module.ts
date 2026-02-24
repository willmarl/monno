import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma.service';
import { CacheModule } from '../../common/cache/cache.module';
@Module({
  imports: [CacheModule],
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}
