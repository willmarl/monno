import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, MinLength, MaxLength } from 'class-validator';
import type { ResourceType } from 'src/common/types/resource.types';

export class CreateCommentDto {
  @ApiProperty({
    description: 'The type of resource being commented on',
    enum: ['POST', 'VIDEO', 'ARTICLE', 'COMMENT'],
    example: 'POST',
  })
  @IsEnum(['POST', 'VIDEO', 'ARTICLE', 'COMMENT'])
  resourceType!: ResourceType;

  @ApiProperty({
    description: 'The ID of the resource being commented on',
    example: 1,
  })
  @IsInt()
  resourceId!: number;

  @ApiProperty({
    description: 'The comment content',
    minLength: 1,
    maxLength: 2000,
    example: 'This is a great post!',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
