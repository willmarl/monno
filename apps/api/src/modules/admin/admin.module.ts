import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';
import { SeedService } from './seed.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [UsersModule], // ← Gets access to UsersService
  controllers: [AdminUsersController],
  providers: [SeedService, PrismaService],
})
export class AdminModule {}
