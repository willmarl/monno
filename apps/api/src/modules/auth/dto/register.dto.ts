import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the new account',
    example: 'newuser_123',
    minLength: 2,
    maxLength: 32,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'username can only contain alphanumeric characters, hyphens, and underscores',
  })
  username!: string;

  @ApiPropertyOptional({
    description: 'Email address for the new account',
    example: 'newuser@example.com',
    maxLength: 256,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'SecurePassword123',
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
