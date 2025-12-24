import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger as Print } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { ProfilingInterceptor } from './interceptors/profiling.interceptor';
import { RateLimitExceptionFilter } from './common/filters/rate-limit.filter';
import { UserAwareThrottlerGuard } from './common/guards/throttle-user.guard';

Print.log('Server running on port ' + process.env.PORT);
Print.log('Database URL ' + process.env.DATABASE_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggingInterceptor(app.get(Logger)));
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(app.get(Logger)),
    new ProfilingInterceptor(app.get(Logger)),
  );

  app.useGlobalGuards(app.get(UserAwareThrottlerGuard));
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new RateLimitExceptionFilter(),
  );
  app.enableCors({
    origin: [
      'http://localhost:3001', // example: your Next.js dev server
      'http://localhost:3000', // if using same port for FE
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
