import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { PROTECTED_RESOURCE_KEY } from '../../decorators/protected-resource.decorator';

/**
 * Generic creatorship guard for any resource with creatorId field
 * Usage: @ProtectedResource('post') @UseGuards(CreatorGuard)
 *
 * The guard expects:
 * - req.user.sub: User ID from JWT
 * - req.params.id: Resource ID from URL
 * - @ProtectedResource('resourceType'): Decorator specifying the resource model (e.g., 'post', 'video', 'article')
 */
@Injectable()
export class CreatorGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const userId = req.user?.sub;
    const resourceId = parseInt(req.params.id, 10);
    const resourceType = this.reflector.getAllAndOverride<string>(
      PROTECTED_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resourceId || isNaN(resourceId))
      throw new NotFoundException('Resource ID missing or invalid');
    if (!resourceType) throw new Error('Resource type not specified');

    // Dynamically query the resource
    const resource = await (this.prisma as any)[resourceType].findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(`${resourceType} not found`);
    }

    if (resource.creatorId !== userId) {
      throw new ForbiddenException(`You do not own this ${resourceType}`);
    }

    return true;
  }
}
