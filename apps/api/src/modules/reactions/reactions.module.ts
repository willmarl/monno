import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService, PrismaService],
})
export class ReactionsModule {}
