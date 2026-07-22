import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PreferencesService } from './preferences.service';
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
  providers: [UsersService, PreferencesService, PrismaService],
  exports: [UsersService, PreferencesService],
})
export class UsersModule {}
