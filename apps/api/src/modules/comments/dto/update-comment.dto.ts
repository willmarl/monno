import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'The updated comment content',
    minLength: 1,
    maxLength: 2000,
    example: 'This is an updated comment',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content?: string;
}
