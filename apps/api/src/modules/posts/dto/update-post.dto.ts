import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    maxLength: 128,
    required: false,
    example: 'This is the updated post content with sufficient length.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @MinLength(1000)
  content?: string;
}
