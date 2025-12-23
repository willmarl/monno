import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configure Pino HTTP logger
    LoggerModule.forRoot({
      pinoHttp: {
        // Set log level based on environment
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        // Custom serializers to redact sensitive data
        serializers: {
          // Request serializer: logs request details while redacting sensitive data
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
            headers: {
              'content-type': req.headers['content-type'],
              'user-agent': req.headers['user-agent'],
              // Security: Redact authorization tokens
              authorization: req.headers.authorization
                ? '[REDACTED]'
                : undefined,
              // Security: Redact cookies containing JWT tokens
              cookie: req.headers.cookie ? '[REDACTED]' : undefined,
            },
          }),
          // Response serializer: logs response details while redacting sensitive data
          res: (res) => ({
            statusCode: res.statusCode,
            headers: {
              'content-type': res.headers?.['content-type'],
              'content-length': res.headers?.['content-length'],
              // Security: Redact set-cookie headers containing JWT tokens
              'set-cookie': res.headers?.['set-cookie']
                ? '[REDACTED]'
                : undefined,
            },
          }),
        },
        // Configure pretty printing for development, disable in production
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true, // Add colors to console output
                  singleLine: false, // Pretty print with multiple lines
                  translateTime: 'SYS:standard', // Human-readable timestamps
                },
              },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
