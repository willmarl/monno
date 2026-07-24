import {
  Injectable,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { areTestEndpointsEnabled } from '../test-endpoints';

@Injectable()
export class TestEndpointsGuard implements CanActivate {
  canActivate(): boolean {
    if (!areTestEndpointsEnabled()) {
      throw new ForbiddenException('Test endpoints are disabled');
    }
    return true;
  }
}
