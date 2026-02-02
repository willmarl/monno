import { IsEnum, IsNumber } from 'class-validator';
import { LIKEABLE_RESOURCES } from 'src/common/types/resource.types';
import type { LikeableResourceType } from 'src/common/types/resource.types';

export class ToggleLikeDto {
  @IsEnum(LIKEABLE_RESOURCES)
  resourceType!: LikeableResourceType;

  @IsNumber()
  resourceId!: number;
}
