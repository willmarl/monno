import { IsOptional, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '../../../generated/prisma/client';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Post title',
    minLength: 1,
    maxLength: 150,
    required: false,
    example: 'Updated Post Title',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @ApiProperty({
    description: 'Post content',
    minLength: 1,
    maxLength: 1000,
    required: false,
    example: 'This is the updated post content with sufficient length.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Who can see this post',
    enum: Visibility,
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
