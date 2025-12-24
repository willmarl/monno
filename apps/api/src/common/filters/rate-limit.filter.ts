import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * RateLimitExceptionFilter - Unified rate limit error responses
 *
 * Catches ThrottlerException (429 Too Many Requests) and returns
 * a response that matches your global API response format.
 *
 * Default throttler response:
 * { message: "ThrottlerException: Throttled" }
 *
 * This filter transforms it to:
 * { success: false, message: "Too many requests...", statusCode: 429 }
 */
@Catch(ThrottlerException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RateLimitExceptionFilter.name);

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = 429;
    const message =
      'Too many requests — please slow down. You have exceeded the rate limit.';

    this.logger.warn({
      message: `Rate limit exceeded: ${exception.message}`,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userId: request.user?.sub || 'anonymous',
    });

    response.status(status).json({
      success: false,
      message,
      error: 'TooManyRequestsException',
      statusCode: status,
    });
  }
}
