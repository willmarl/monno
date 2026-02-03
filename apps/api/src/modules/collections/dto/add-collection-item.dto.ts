import { IsEnum, IsInt, Min } from 'class-validator';
import type { CollectableResourceType } from 'src/common/types/resource.types';
import { ResourceTypeEnum } from 'src/common/types/resource.types';

export class AddCollectionItemDto {
  @IsEnum(ResourceTypeEnum)
  resourceType!: CollectableResourceType;

  @IsInt()
  @Min(1)
  resourceId!: number;
}
