import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ViewRateLimiterService } from '../rate-limiters/view-rate-limiter.service';

@Injectable()
export class ViewRateLimitMiddleware implements NestMiddleware {
  constructor(private viewRateLimiter: ViewRateLimiterService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Attach the rate limiter to the request so the decorator can access it
    (req as any).viewRateLimiter = this.viewRateLimiter;
    next();
  }
}
