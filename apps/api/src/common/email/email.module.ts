import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailRendererService } from './email-renderer.service';
import { LogoService } from '../logo/logo.service';
import { PrismaService } from '../../prisma.service';
import { AccountStatusEmailService } from './account-status-email.service';
import { EmailSettingsService } from './email-settings.service';
import { StripePurchaseEmailService } from './stripe-purchase-email.service';
import { QueueModule } from '../../modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [
    EmailService,
    EmailRendererService,
    LogoService,
    PrismaService,
    AccountStatusEmailService,
    EmailSettingsService,
    StripePurchaseEmailService,
  ],
  exports: [
    EmailService,
    EmailRendererService,
    LogoService,
    AccountStatusEmailService,
    EmailSettingsService,
    StripePurchaseEmailService,
  ],
})
export class EmailModule {}
