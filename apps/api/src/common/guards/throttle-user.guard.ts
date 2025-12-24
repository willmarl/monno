import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * UserAwareThrottlerGuard - Smart rate limiting
 *
 * For authenticated users: throttle by userId
 * For guests: throttle by IP address
 *
 * This ensures:
 * - Office workers on same IP don't kill each other's limits
 * - Logged-in users get fair individual limits
 * - Guests still get protected by IP-based limits
 */
@Injectable()
export class UserAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated → use their userId as the tracker
    if (req.user?.sub) {
      return `user-${req.user.sub}`;
    }

    // Otherwise fall back to IP address for guests
    return req.ip;
  }
}
