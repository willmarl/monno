import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV || 'development',
  release: process.env.SENTRY_RELEASE || 'unknown',
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
});
