import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { VIEWABLE_RESOURCES } from 'src/common/types/resource.types';
import type { ViewableResourceType } from 'src/common/types/resource.types';

export class CreateViewDto {
  @ApiProperty({
    description: 'The type of resource to view',
    enum: VIEWABLE_RESOURCES,
    example: 'post',
  })
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType!: ViewableResourceType;

  @ApiProperty({
    description: 'The ID of the resource to view',
    minimum: 1,
    example: 1,
  })
  @IsNumber()
  resourceId!: number;
}
