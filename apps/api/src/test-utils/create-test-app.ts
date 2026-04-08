import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test env vars at module import time — before NestJS DI compiles any module.
// This ensures PrismaService reads the test DATABASE_URL, not the dev one.
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AllExceptionsFilter } from '../common/filters/http-exception.filter';
import { RateLimitExceptionFilter } from '../common/filters/rate-limit.filter';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import cookieParser from 'cookie-parser';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/**
 * Creates a full NestJS test application using the real AppModule.
 * Uses the test database from .env.test.
 * Does NOT apply rate limiting (no UserAwareThrottlerGuard as global guard).
 *
 * Usage in specs:
 *   let testApp: TestApp;
 *   beforeAll(async () => { testApp = await createTestApp(); });
 *   afterAll(async () => { await testApp.app.close(); });
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  // Replicate the global setup from main.ts (minus logging/swagger/bull board)
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new RateLimitExceptionFilter(),
  );
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}
