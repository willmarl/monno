import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

Logger.log('Server running on port ' + process.env.PORT);
Logger.log('Database URL ' + process.env.DATABASE_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
