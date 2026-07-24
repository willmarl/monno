import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from '../app.service';
import { JwtAccessGuard } from '../modules/auth/guards/jwt-access.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { TestEndpointsGuard } from './guards/test-endpoints.guard';

/**
 * Registered only when ENABLE_TEST_ENDPOINTS=true (see AppModule).
 * Guard is a second line of defense if the controller is ever mounted by mistake.
 */
@ApiTags('Test (dev)')
@Controller()
@UseGuards(TestEndpointsGuard)
export class TestEndpointsController {
  constructor(private readonly appService: AppService) {}

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
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded (3 per minute)',
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
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
