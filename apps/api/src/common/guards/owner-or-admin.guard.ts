import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

/**
 * Guard to restrict access to user-specific data
 * Allows access if:
 * - The user ID in the route params matches the authenticated user's ID (owner), OR
 * - The authenticated user has ADMIN role
 *
 * Usage: @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
 *
 * The guard expects:
 * - req.user.sub: User ID from JWT
 * - req.user.role: User role from JWT
 * - req.params.userId: User ID from URL
 */
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const authenticatedUserId = req.user?.sub;
    const requestedUserId = parseInt(req.params.userId, 10);
    const userRole = req.user?.role;

    if (!authenticatedUserId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!requestedUserId || isNaN(requestedUserId)) {
      throw new BadRequestException('Invalid userId parameter');
    }

    // Allow if user is accessing their own data
    if (authenticatedUserId === requestedUserId) {
      return true;
    }

    // Allow if user is admin
    if (userRole === 'ADMIN') {
      return true;
    }

    // Otherwise deny
    throw new ForbiddenException('You do not have access to this resource');
  }
}
