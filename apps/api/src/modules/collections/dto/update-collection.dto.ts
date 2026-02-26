import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCollectionDto {
  @ApiPropertyOptional({
    description: 'The new name for the collection',
    minLength: 1,
    maxLength: 100,
    example: 'Updated Collection Name',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'The new description for the collection',
    minLength: 1,
    maxLength: 2000,
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;
}
