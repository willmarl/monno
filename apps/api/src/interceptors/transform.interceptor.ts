import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Pull custom message from decorator (if present)
    const successMessage =
      this.reflector.get<string>(SUCCESS_MESSAGE_KEY, context.getHandler()) ??
      'OK';

    return next.handle().pipe(
      map((data) => {
        // Do not wrap error responses
        if (data?.success === false) {
          return data;
        }

        return {
          success: true,
          message: successMessage,
          data,
        };
      }),
    );
  }
}
