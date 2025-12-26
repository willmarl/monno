import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailRendererService } from './email-renderer.service';

@Module({
  providers: [EmailService, EmailRendererService],
  exports: [EmailService, EmailRendererService],
})
export class EmailModule {}
