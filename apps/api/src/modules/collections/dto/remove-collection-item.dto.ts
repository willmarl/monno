import { IsEnum, IsInt, Min } from 'class-validator';
import type { CollectableResourceType } from 'src/common/types/resource.types';
import { ResourceTypeEnum } from 'src/common/types/resource.types';

export class RemoveCollectionItemDto {
  @IsEnum(ResourceTypeEnum)
  resourceType!: CollectableResourceType;

  @IsInt()
  @Min(1)
  resourceId!: number;
}
