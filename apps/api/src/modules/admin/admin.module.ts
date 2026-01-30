import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';
import { AdminPostsController } from './admin-post.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './admin-user.service';
import { AdminPostService } from './admin-post.service';
import { SeedService } from './seed.service';
import { PrismaService } from '../../prisma.service';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminController, AdminUsersController, AdminPostsController],
  providers: [
    AdminService,
    AdminUserService,
    AdminPostService,
    SeedService,
    PrismaService,
    FileProcessingService,
  ],
  exports: [AdminService, AdminUserService, AdminPostService],
})
export class AdminModule {}
