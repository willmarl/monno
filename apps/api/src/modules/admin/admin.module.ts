import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserService } from './admin-user.service';
import { SeedService } from './seed.service';
import { PrismaService } from '../../prisma.service';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminController, AdminUsersController],
  providers: [
    AdminService,
    AdminUserService,
    SeedService,
    PrismaService,
    FileProcessingService,
  ],
  exports: [AdminService, AdminUserService],
})
export class AdminModule {}
