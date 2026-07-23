import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { FileProcessingModule } from '../../common/file-processing/file-processing.module';
import { EmailModule } from '../../common/email/email.module';
import { QueueModule } from '../queue/queue.module';
import { PresenceModule } from '../presence/presence.module';
import { StripeModule } from '../stripe/stripe.module';
import { AdminUsersController } from './users/admin-user.controller';
import { AdminPostsController } from './posts/admin-post.controller';
import { AdminCommentsController } from './comments/admin-comment.controller';
import { AdminCollectionsController } from './collections/admin-collection.controller';
import { AdminStripeController } from './stripe/admin-stripe.controller';
import { AdminSupportsController } from './support/admin-support.controller';
import { AdminArticlesController } from './articles/admin-article.controller';
import { AdminReportsController } from './reports/admin-report.controller';
import { AdminEmailSettingsController } from './settings/admin-email-settings.controller';
import { AdminComposeEmailService } from './settings/admin-compose-email.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './users/admin-user.service';
import { AdminPostService } from './posts/admin-post.service';
import { AdminCommentService } from './comments/admin-comment.service';
import { AdminCollectionService } from './collections/admin-collection.service';
import { AdminStripeService } from './stripe/admin-stripe.service';
import { AdminSupportService } from './support/admin-support.service';
import { AdminReportService } from './reports/admin-report.service';
import { SeedService } from './seed.service';
import { PrismaService } from '../../prisma.service';
import { AdminArticleService } from './articles/admin-article.service';

@Module({
  imports: [
    UsersModule,
    MediaModule,
    FileProcessingModule,
    EmailModule,
    QueueModule,
    PresenceModule,
    StripeModule,
  ],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminPostsController,
    AdminCommentsController,
    AdminCollectionsController,
    AdminStripeController,
    AdminSupportsController,
    AdminArticlesController,
    AdminReportsController,
    AdminEmailSettingsController,
  ],
  providers: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminCollectionService,
    AdminStripeService,
    AdminSupportService,
    AdminReportService,
    AdminArticleService,
    AdminComposeEmailService,
    SeedService,
    PrismaService,
  ],
  exports: [
    AdminService,
    AdminUserService,
    AdminPostService,
    AdminCommentService,
    AdminCollectionService,
    AdminStripeService,
    AdminSupportService,
    AdminReportService,
    AdminArticleService,
  ],
})
export class AdminModule {}
