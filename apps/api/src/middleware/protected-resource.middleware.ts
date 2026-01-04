import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PROTECTED_RESOURCE_KEY } from '../decorators/protected-resource.decorator';

/**
 * Middleware to extract protected resource type from route metadata and inject into request
 */
@Injectable()
export class ProtectedResourceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get protected resource type from route metadata
    const resourceType = Reflect.getMetadata(
      PROTECTED_RESOURCE_KEY,
      req.route?.stack?.[0]?.handle,
    );

    if (resourceType) {
      (req as any).protectedResource = resourceType;
    }

    next();
  }
}
