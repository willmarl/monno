import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import type { CollectableResourceType } from 'src/common/types/resource.types';
import { ResourceTypeEnum } from 'src/common/types/resource.types';

export class AddCollectionItemDto {
  @ApiProperty({
    description: 'The type of resource to add to the collection',
    enum: ResourceTypeEnum,
    example: 'post',
  })
  @IsEnum(ResourceTypeEnum)
  resourceType!: CollectableResourceType;

  @ApiProperty({
    description: 'The ID of the resource to add',
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  resourceId!: number;
}
