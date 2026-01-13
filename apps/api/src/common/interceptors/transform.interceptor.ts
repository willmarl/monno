import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SUCCESS_MESSAGE_KEY } from '../../decorators/success-message.decorator';

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

        // Check if this is a paginated response with a redirect
        const isRedirected = data?.isRedirected === true;
        let message = successMessage;
        let responseData = data;

        if (isRedirected) {
          message = 'Requested offset out of bounds. Redirected to last page.';
          // Remove isRedirected flag from response data
          const { isRedirected: _, requestedOffset: __, ...cleanData } = data;
          responseData = cleanData;
        }

        return {
          success: true,
          message,
          data: responseData,
        };
      }),
    );
  }
}
