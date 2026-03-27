import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import {
  COLLECTABLE_RESOURCES,
  type CollectableResourceType,
} from 'src/common/types/resource.types';

export class RemoveCollectionItemDto {
  @ApiProperty({
    description: 'The type of resource to remove from the collection',
    enum: COLLECTABLE_RESOURCES,
    example: 'POST',
  })
  @IsEnum(COLLECTABLE_RESOURCES)
  resourceType!: CollectableResourceType;

  @ApiProperty({
    description: 'The ID of the resource to remove',
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  resourceId!: number;
}
