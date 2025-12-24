import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const id = uuid();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
