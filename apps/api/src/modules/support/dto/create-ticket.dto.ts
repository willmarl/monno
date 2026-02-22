import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;
}
