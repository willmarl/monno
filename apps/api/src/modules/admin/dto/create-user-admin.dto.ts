import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from '../../../generated/prisma/client';

export class CreateUserAdminDto {
  @ApiProperty({
    description: 'Username for the account',
    example: 'john_doe',
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
    description: 'Avatar path or URL for the user',
    example: '/avatars/user-avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarPath?: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'john@example.com',
    maxLength: 256,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'SecurePassword123',
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: 'USER',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: UserStatus,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Violated community guidelines',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  statusReason?: string;
}
