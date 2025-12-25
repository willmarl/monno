import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'username can only contain alphanumeric characters, hyphens, and underscores',
  })
  username!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
