import { Module } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [RiskScoringService, PrismaService],
  exports: [RiskScoringService],
})
export class RiskScoringModule {}
