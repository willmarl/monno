import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './users/admin-user.controller';
import { AdminPostsController } from './posts/admin-post.controller';
import { AdminCommentsController } from './comments/admin-comment.controller';
import { AdminCollectionsController } from './collections/admin-collection.controller';
import { AdminStripeController } from './stripe/admin-stripe.controller';
import { AdminSupportsController } from './support/admin-support.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './users/admin-user.service';
import { AdminPostService } from './posts/admin-post.service';
import { AdminCommentService } from './comments/admin-comment.service';
import { AdminCollectionService } from './collections/admin-collection.service';
import { AdminStripeService } from './stripe/admin-stripe.service';
import { AdminSupportService } from './support/admin-support.service';
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
