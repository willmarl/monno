import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email to log in with',
    example: 'john_doe',
    minLength: 2,
    maxLength: 256,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(256)
  username!: string;

  @ApiProperty({
    description: 'Password to log in with',
    example: 'SecurePassword123',
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
