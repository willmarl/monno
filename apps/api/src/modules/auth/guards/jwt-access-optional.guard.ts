import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { catchError } from 'rxjs';
import { of } from 'rxjs';

/**
 * Optional JWT guard that validates the token if present,
 * but doesn't fail if missing. Allows public access with optional auth.
 */
@Injectable()
export class JwtAccessOptionalGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    // Get the result from parent guard (can be boolean, Promise, or Observable)
    const result = super.canActivate(context);

    // Handle synchronous boolean responses
    if (typeof result === 'boolean') {
      return result;
    }

    // Handle Promise responses
    if (result instanceof Promise) {
      return result.catch(() => true);
    }

    // Handle Observable responses (from AuthGuard)
    return result.pipe(
      catchError(() => of(true)), // On error, return true to allow request
    );
  }
}
