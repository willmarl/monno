import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';
import { AdminPostsController } from './admin-post.controller';
import { AdminCommentsController } from './admin-comment.controller';
import { AdminCollectionsController } from './admin-collection.controller';
import { AdminStripeController } from './admin-stripe.controller';
import { AdminSupportsController } from './admin-support.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './admin-user.service';
import { AdminPostService } from './admin-post.service';
import { AdminCommentService } from './admin-comment.service';
import { AdminCollectionService } from './admin-collection.service';
import { AdminStripeService } from './admin-stripe.service';
import { AdminSupportService } from './admin-support.service';
import { SeedService } from './seed.service';
import { PrismaService } from '../../prisma.service';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';

@Module({
  imports: [UsersModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminPostsController,
    AdminCommentsController,
    AdminCollectionsController,
    AdminStripeController,
    AdminSupportsController,
  ],
  providers: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminCollectionService,
    AdminStripeService,
    AdminSupportService,
    SeedService,
    PrismaService,
    FileProcessingService,
  ],
  exports: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminCollectionService,
    AdminStripeService,
    AdminSupportService,
  ],
})
export class AdminModule {}
