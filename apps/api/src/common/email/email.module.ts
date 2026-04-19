import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailRendererService } from './email-renderer.service';
import { LogoService } from '../logo/logo.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [EmailService, EmailRendererService, LogoService, PrismaService],
  exports: [EmailService, EmailRendererService, LogoService],
})
export class EmailModule {}
