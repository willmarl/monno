import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

// 🔧 Quick DX: Set to false to disable test endpoints
const ENABLE_TEST_ENDPOINTS = false;

@Injectable()
export class TestEndpointsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!ENABLE_TEST_ENDPOINTS) {
      throw new ForbiddenException('Test endpoints are disabled');
    }
    return true;
  }
}
