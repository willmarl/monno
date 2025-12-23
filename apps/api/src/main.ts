import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger as Print } from '@nestjs/common';

Print.log('Server running on port ' + process.env.PORT);
Print.log('Database URL ' + process.env.DATABASE_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
