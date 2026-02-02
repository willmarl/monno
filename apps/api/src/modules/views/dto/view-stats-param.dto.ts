import { IsEnum, IsNumberString } from 'class-validator';
import { VIEWABLE_RESOURCES } from 'src/common/types/resource.types';
import type { ViewableResourceType } from 'src/common/types/resource.types';

export class ViewStatsParamDto {
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType!: ViewableResourceType;

  @IsNumberString()
  resourceId!: string;
}
