import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma.service';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [UsersModule, QueueModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
