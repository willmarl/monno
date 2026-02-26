import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
    minLength: 1,
    maxLength: 2000,
    example: 'This is a detailed description of my collection',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;
}
