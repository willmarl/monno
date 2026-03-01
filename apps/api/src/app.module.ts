import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { ViewRateLimitMiddleware } from './common/middleware/view-rate-limit.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserAwareThrottlerGuard } from './common/guards/throttle-user.guard';
import { rateLimitConfig } from './config/rate-limit.config';
import { QueueModule } from './modules/queue/queue.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { FilesModule } from './modules/files/files.module';
import { EmailModule } from './common/email/email.module';
import { OauthModule } from './modules/auth/oauth/oauth.module';
import { AdminModule } from './modules/admin/admin.module';
import { PostsModule } from './modules/posts/posts.module';
import { LikesModule } from './modules/likes/likes.module';
import { ViewsModule } from './modules/views/views.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SupportModule } from './modules/support/support.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaService } from './prisma.service';
@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_GLOBAL_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_GLOBAL_LIMIT || '100', 10),
      },
    ]),
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
    QueueModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    FilesModule,
    EmailModule,
    OauthModule,
    AdminModule,
    PostsModule,
    LikesModule,
    ViewsModule,
    CollectionsModule,
    CommentsModule,
    AnalyticsModule,
    StripeModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserAwareThrottlerGuard, QueueModule, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, ViewRateLimitMiddleware).forRoutes('*');
  }
}
