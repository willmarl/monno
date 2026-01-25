import {
  IsOptional,
  IsString,
  MinLength,
  IsEmail,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from '../../../generated/prisma/client';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({
    description: 'Username for the account',
    example: 'john_doe',
    minLength: 2,
    maxLength: 32,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

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

  @ApiPropertyOptional({
    description: 'Password for the account',
    example: 'SecurePassword123',
    minLength: 1,
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password?: string;

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
    description: 'Reason for status change (ban, suspension, deletion, etc)',
    example: 'Violated community guidelines',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  statusReason?: string;
}
