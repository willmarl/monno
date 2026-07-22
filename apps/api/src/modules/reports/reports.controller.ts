import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { rateLimitConfig } from 'src/config/rate-limit.config';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Throttle({ default: rateLimitConfig.strict })
  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req, @Body() body: CreateReportDto) {
    return this.reportsService.create(Number(req.user.sub), body);
  }
}
