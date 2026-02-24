import { ExceptionFilter, Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';

    // Prisma unique violation
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = 409; // Conflict
        let field = 'unknown field';

        // Try to extract field from constraint name in error message
        const cause = (exception?.meta as any)?.driverAdapterError?.cause;
        if (cause?.originalMessage) {
          const match = cause.originalMessage.match(/"User_(\w+)_key"/);
          if (match) {
            field = match[1];
          }
        }

        message = `${field} already exists`;
        errorName = 'ConflictException';
      }
    }
    // NestJS HttpExceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract validation error messages if they exist
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse &&
        Array.isArray(exceptionResponse.message)
      ) {
        message = exceptionResponse.message;
      } else {
        message = exception.message;
      }

      errorName = exception.name;
    }

    this.logger.error({
      message:
        exception instanceof Error ? exception.message : String(exception),
      status: status,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      success: false,
      message,
      error: errorName,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
