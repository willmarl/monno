import { IsString, IsEnum, IsInt, MinLength } from 'class-validator';
import type { ResourceType } from 'src/common/types/resource.types';

export class CreateCommentDto {
  @IsEnum(['POST', 'VIDEO', 'ARTICLE', 'COMMENT'])
  resourceType!: ResourceType;

  @IsInt()
  resourceId!: number;

  @IsString()
  @MinLength(1)
  content!: string;
}
