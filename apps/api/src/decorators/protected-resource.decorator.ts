import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const PROTECTED_RESOURCE_KEY = 'protectedResource';

/**
 * Decorator to mark a route as protected by ownership
 * Usage: @ProtectedResource('post') or @ProtectedResource('video')
 */
export const ProtectedResource = (type: string) =>
  SetMetadata(PROTECTED_RESOURCE_KEY, type);

/**
 * Param decorator to inject the protected resource type into request
 */
export const GetProtectedResource = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.protectedResource;
  },
);
