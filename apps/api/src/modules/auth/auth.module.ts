import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AccessTokenStrategy } from './strategies/access.strategy';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';
import { GeolocationModule } from '../../common/geolocation/geolocation.module';
import { RiskScoringModule } from '../../common/risk-scoring/risk-scoring.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    GeolocationModule,
    RiskScoringModule,
    JwtModule.register({}), // configure tokens in service
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    UsersService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AuthModule {}
