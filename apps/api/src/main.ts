import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger as Print } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { ProfilingInterceptor } from './common/interceptors/profiling.interceptor';
import { RateLimitExceptionFilter } from './common/filters/rate-limit.filter';
import { UserAwareThrottlerGuard } from './common/guards/throttle-user.guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupBullBoard } from './modules/queue/bull-board.setup';
import { QueueService } from './modules/queue/queue.service';
import { SeedService } from './modules/admin/seed.service';
import * as express from 'express';

Print.log('Server running on port ' + process.env.PORT);
Print.log('Database URL ' + process.env.DATABASE_URL);
Print.log(
  'Redis config: ' +
    (process.env.REDIS_HOST || 'localhost') +
    ':' +
    (process.env.REDIS_PORT || 6379),
);
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

  // Preserve raw body for Stripe webhook signature verification
  app.use(
    express.json({
      verify: (req: any, res: any, buf: Buffer) => {
        if (req.originalUrl.includes('/stripe/webhook')) {
          req.rawBody = buf.toString('utf-8');
        }
      },
    }),
  );

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
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
  /* Swagger docs */
  const config = new DocumentBuilder()
    .setTitle('Monno: Next + Nest Fullstack API')
    .setDescription('API documentation for your monorepo')
    .setVersion('1.0')
    .addBearerAuth() // enables JWT auth button
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  /* Bull Board setup for queue monitoring */
  const queueService = app.get(QueueService);
  const bullBoardAdapter = setupBullBoard(queueService.getJobsQueue());
  app.use('/admin/queues', bullBoardAdapter.getRouter());

  /* Seed admin account on startup*/
  const seedService = app.get(SeedService);
  await seedService.seedAdminAccount();

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
