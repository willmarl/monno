import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    description: 'The title of the support ticket',
    minLength: 1,
    maxLength: 100,
    example: 'Issue with account login',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'The detailed message describing the issue',
    minLength: 1,
    maxLength: 2000,
    example: 'I am unable to log into my account',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({
    description: 'Contact email address for the support ticket',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;
}
