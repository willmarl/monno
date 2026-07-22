import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailRendererService } from './email-renderer.service';
import { LogoService } from '../logo/logo.service';
import { PrismaService } from '../../prisma.service';
import { AccountStatusEmailService } from './account-status-email.service';
import { QueueModule } from '../../modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [
    EmailService,
    EmailRendererService,
    LogoService,
    PrismaService,
    AccountStatusEmailService,
  ],
  exports: [
    EmailService,
    EmailRendererService,
    LogoService,
    AccountStatusEmailService,
  ],
})
export class EmailModule {}
