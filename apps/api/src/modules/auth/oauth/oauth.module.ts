import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { QueueModule } from '../../queue/queue.module';
import { JwtModule } from '@nestjs/jwt';
import { GeolocationModule } from '../../../common/geolocation/geolocation.module';
import { RiskScoringModule } from '../../../common/risk-scoring/risk-scoring.module';
import { PrismaService } from '../../../prisma.service';

@Module({
  imports: [
    HttpModule,
    QueueModule,
    GeolocationModule,
    RiskScoringModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
    }),
  ],
  providers: [OauthService, PrismaService],
  controllers: [OauthController],
})
export class OauthModule {}
