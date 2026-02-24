import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from './modules/auth/guards/jwt-access.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaService } from './prisma.service';

@ApiTags('Generic / Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Returns a simple health check message',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    // lightweight DB check
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/debug-sentry')
  getError() {
    throw new Error('My Sentry error!');
  }

  @ApiOperation({ summary: 'Test rate limiting' })
  @ApiResponse({
    status: 200,
    description: 'Returns a rate limit test message',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OK' },
        data: { type: 'string', example: 'Rate limit test' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded (3 per minute)',
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
  @Get('rate')
  getRateTest(): string {
    return this.appService.rateLimitTest();
  }

  @Get('worker')
  workerTest(): Promise<string> {
    return this.appService.workerTest();
  }

  @UseGuards(JwtAccessGuard)
  @Get('userNeeded')
  userOnlyTest(): string {
    return this.appService.userOnlyTest();
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('adminOnly')
  adminOnlyTest(): string {
    return this.appService.adminOnlyTest();
  }

  @ApiOperation({ summary: 'Test error handling (500)' })
  @ApiResponse({
    status: 500,
    description: 'Returns a 500 error for testing',
  })
  @Get('error')
  errorTest(): void {
    return this.appService.errorTest();
  }
}
