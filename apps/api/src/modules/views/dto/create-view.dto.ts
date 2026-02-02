import { IsEnum, IsNumber } from 'class-validator';
import { VIEWABLE_RESOURCES } from 'src/common/types/resource.types';
import type { ViewableResourceType } from 'src/common/types/resource.types';

export class CreateViewDto {
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType!: ViewableResourceType;

  @IsNumber()
  resourceId!: number;
}
