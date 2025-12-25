import {
  IsOptional,
  IsString,
  MinLength,
  IsEmail,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'username can only contain alphanumeric characters, hyphens, and underscores',
  })
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;
}
