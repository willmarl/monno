import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';
import { AdminPostsController } from './admin-post.controller';
import { AdminCommentsController } from './admin-comment.controller';
import { AdminStripeController } from './admin-stripe.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './admin-user.service';
import { AdminPostService } from './admin-post.service';
import { AdminCommentService } from './admin-comment.service';
import { AdminStripeService } from './admin-stripe.service';
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
    AdminStripeController,
  ],
  providers: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminStripeService,
    SeedService,
    PrismaService,
    FileProcessingService,
  ],
  exports: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminStripeService,
  ],
})
export class AdminModule {}
