import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from './modules/auth/guards/jwt-access.guard';

@ApiTags('Generic / Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
