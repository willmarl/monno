import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [SessionsController],
  providers: [PrismaService],
})
export class SessionsModule {}
