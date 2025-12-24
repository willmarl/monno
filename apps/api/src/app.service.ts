import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  rateLimitTest(): string {
    return 'This request should be rate limited after 3 GETs';
  }
}
