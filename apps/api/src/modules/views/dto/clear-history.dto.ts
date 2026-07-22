import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  VIEWABLE_RESOURCES,
  type ViewableResourceType,
} from 'src/common/types/resource.types';

export class ClearHistoryDto {
  @ApiPropertyOptional({
    description:
      'If set, only soft-delete history for this resource type (active tab)',
    enum: VIEWABLE_RESOURCES,
    example: 'POST',
  })
  @IsOptional()
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType?: ViewableResourceType;
}
