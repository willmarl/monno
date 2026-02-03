import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma.service';
import { FileProcessingModule } from '../../common/file-processing/file-processing.module';
import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [
    FileProcessingModule,
    forwardRef(() => AuthModule),
    CollectionsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
