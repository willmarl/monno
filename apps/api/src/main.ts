import 'dotenv/config'; // Load env vars FIRST
import './instrument';
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
import { CsrfGuard } from './common/guards/csrf.guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupBullBoard } from './modules/queue/bull-board.setup';
import { createBullBoardAdminMiddleware } from './modules/queue/bull-board-auth.middleware';
import { QueueService } from './modules/queue/queue.service';
import { SeedService } from './modules/admin/seed.service';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { requireJwtSecrets } from './config/jwt-secrets';
import { getCookieSameSite } from './config/cookie.config';
import * as express from 'express';

function getCorsOrigins(): string[] {
  const origins = new Set(['http://localhost:3000']);
  if (process.env.FRONTEND_URL) {
    try {
      const url = new URL(process.env.FRONTEND_URL);
      const apex = url.hostname.replace(/^www\./, '');
      origins.add(process.env.FRONTEND_URL);
      origins.add(`${url.protocol}//${apex}`);
      origins.add(`${url.protocol}//www.${apex}`);
    } catch {
      origins.add(process.env.FRONTEND_URL);
    }
  }
  return [...origins];
}

Print.log('Server running on port ' + process.env.PORT);
Print.log('Frontend URL ' + process.env.FRONTEND_URL);
Print.log(
  'Database configured: ' + (process.env.DATABASE_URL ? 'yes' : 'no'),
);
const corsOrigins = getCorsOrigins();

Print.log('CORS origins allowed: ' + JSON.stringify(corsOrigins));
Print.log('Cookie SameSite: ' + getCookieSameSite());

async function bootstrap() {
  requireJwtSecrets();

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

  // So req.ip reflects the real client behind nginx/Caddy (guest throttle key).
  // TRUST_PROXY=false to disable; number/string hop count otherwise; default 1 in production.
  const trustProxy = process.env.TRUST_PROXY;
  const httpAdapter = app.getHttpAdapter().getInstance();
  if (trustProxy === 'false' || trustProxy === '0') {
    httpAdapter.set('trust proxy', false);
  } else if (trustProxy !== undefined && trustProxy !== '') {
    const asNum = Number(trustProxy);
    httpAdapter.set(
      'trust proxy',
      Number.isFinite(asNum) && trustProxy.trim() !== '' ? asNum : trustProxy,
    );
  } else if (process.env.NODE_ENV === 'production') {
    httpAdapter.set('trust proxy', 1);
  }

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
  app.useGlobalGuards(new CsrfGuard(), app.get(UserAwareThrottlerGuard));
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new RateLimitExceptionFilter(),
  );

  app.enableCors({
    origin: corsOrigins,
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

  /* Bull Board — disabled when BULL_BOARD_ENABLED=false; always ADMIN-gated */
  const bullBoardEnabled = process.env.BULL_BOARD_ENABLED !== 'false';
  if (bullBoardEnabled) {
    const queueService = app.get(QueueService);
    const bullBoardAdapter = setupBullBoard(queueService.getJobsQueue());
    app.use(
      '/admin/queues',
      createBullBoardAdminMiddleware(app.get(PrismaService), app.get(JwtService)),
      bullBoardAdapter.getRouter(),
    );
    Print.log('Bull Board mounted at /admin/queues (ADMIN session required)');
  } else {
    Print.log('Bull Board disabled (BULL_BOARD_ENABLED=false)');
  }

  /* Seed admin account on startup*/
  const seedService = app.get(SeedService);
  await seedService.seedAdminAccount();

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
