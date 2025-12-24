import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
