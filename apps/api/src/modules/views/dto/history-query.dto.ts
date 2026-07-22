import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import {
  VIEWABLE_RESOURCES,
  type ViewableResourceType,
} from 'src/common/types/resource.types';

export class HistoryQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Resource type to list history for',
    enum: VIEWABLE_RESOURCES,
    example: 'POST',
  })
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType!: ViewableResourceType;

  @ApiPropertyOptional({
    description: 'Search query filtered against resource title/content',
    example: 'hello',
  })
  @IsOptional()
  @IsString()
  query?: string;
}
