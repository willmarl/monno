import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProfilingInterceptor implements NestInterceptor {
  private readonly SLOW_THRESHOLD_MS = 300; // tweak as you like

  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;

        if (duration > this.SLOW_THRESHOLD_MS) {
          this.logger.warn({
            msg: 'Slow request detected',
            method,
            url,
            duration,
          });
        } else {
          this.logger.debug({
            msg: 'Request timing',
            method,
            url,
            duration,
          });
        }
      }),
    );
  }
}
