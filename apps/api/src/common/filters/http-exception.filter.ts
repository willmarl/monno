import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';

    // Prisma unique violation
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = 409; // Conflict
        message = `Unique constraint failed: ${exception?.meta?.target}`;
        errorName = 'ConflictException';
      }
    }
    // NestJS HttpExceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
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
