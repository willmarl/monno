import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email address to send the password reset link to',
    example: 'user@example.com',
    maxLength: 256,
  })
  @IsEmail()
  @MaxLength(256)
  email!: string;
}
