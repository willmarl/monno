import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'SecurePassword123',
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  newPassword!: string;
}
