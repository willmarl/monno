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
export class CorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const requestId = req.requestId;

    this.logger.logger.info({
      msg: 'Incoming request',
      url: req.url,
      method: req.method,
      requestId,
    });

    return next.handle().pipe(
      tap(() => {
        this.logger.logger.info({
          msg: 'Completed request',
          url: req.url,
          method: req.method,
          requestId,
        });
      }),
    );
  }
}
