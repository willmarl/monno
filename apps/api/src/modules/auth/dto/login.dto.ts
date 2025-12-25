import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'username can only contain alphanumeric characters, hyphens, and underscores',
  })
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
