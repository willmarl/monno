import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-user.controller';

@Module({
  imports: [UsersModule], // ← Gets access to UsersService
  controllers: [AdminUsersController],
})
export class AdminModule {}
