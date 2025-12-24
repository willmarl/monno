import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AccessTokenStrategy } from './strategies/access.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}), // configure tokens in service
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UsersService, AccessTokenStrategy],
})
export class AuthModule {}
