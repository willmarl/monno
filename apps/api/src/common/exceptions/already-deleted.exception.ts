import { HttpException, HttpStatus } from '@nestjs/common';

export class AlreadyDeletedException extends HttpException {
  constructor(message: string = 'Resource was already deleted') {
    super(
      {
        statusCode: HttpStatus.GONE,
        message,
      },
      HttpStatus.GONE,
    );
  }
}
