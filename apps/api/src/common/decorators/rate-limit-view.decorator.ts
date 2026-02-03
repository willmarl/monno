import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ViewRateLimiterService } from '../rate-limiters/view-rate-limiter.service';

export const RateLimitView = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const rateLimiter: ViewRateLimiterService = request.viewRateLimiter;

    if (!rateLimiter) {
      console.warn('[RateLimitView] Rate limiter not attached to request');
      return true; // Default to counting if not available
    }

    const userId = request.user?.sub ? Number(request.user.sub) : undefined;
    const ipAddress = request.ip || request.socket.remoteAddress || 'unknown';

    // Extract resourceType and resourceId from request body
    const { resourceType, resourceId } = request.body || {};

    // Returns true if view should be counted, false if rate limited
    // Rate limit is per resource (user can view different posts, but not spam same post)
    return rateLimiter.isViewAllowed(
      userId,
      ipAddress,
      resourceType,
      resourceId,
    );
  },
);
