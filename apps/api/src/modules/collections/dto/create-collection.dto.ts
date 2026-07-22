import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { Visibility } from '../../../generated/prisma/client';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'The name of the collection',
    minLength: 1,
    maxLength: 100,
    example: 'My Collection',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the collection',
    maxLength: 2000,
    example: 'This is a detailed description of my collection',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Who can see this collection (default PRIVATE)',
    enum: Visibility,
    default: Visibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
