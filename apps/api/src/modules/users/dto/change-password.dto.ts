import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  newPassword?: string;
}
