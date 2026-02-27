import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { LIKEABLE_RESOURCES } from 'src/common/types/resource.types';
import type { LikeableResourceType } from 'src/common/types/resource.types';

export class ToggleLikeDto {
  @ApiProperty({
    description: 'The type of resource to like',
    enum: LIKEABLE_RESOURCES,
    example: 'post',
  })
  @IsEnum(LIKEABLE_RESOURCES)
  resourceType!: LikeableResourceType;

  @ApiProperty({
    description: 'The ID of the resource to like',
    minimum: 1,
    example: 1,
  })
  @IsNumber()
  resourceId!: number;
}
