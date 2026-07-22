import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import {
  VIEWABLE_RESOURCES,
  type ViewableResourceType,
} from 'src/common/types/resource.types';

export class AdminViewHistoryQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Resource type to list history for',
    enum: VIEWABLE_RESOURCES,
    example: 'POST',
  })
  @IsEnum(VIEWABLE_RESOURCES)
  resourceType!: ViewableResourceType;

  @ApiPropertyOptional({
    description: 'Search query filtered against resource title/content',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Filter by soft-delete status: all (default), active, or cleared',
    enum: ['all', 'active', 'cleared'],
    example: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'active', 'cleared'])
  @Transform(({ value }) => value ?? 'all')
  status?: 'all' | 'active' | 'cleared' = 'all';
}
