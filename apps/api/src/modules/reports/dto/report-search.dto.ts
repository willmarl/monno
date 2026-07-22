import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { ReportStatus } from 'src/generated/prisma/client';
import {
  REPORTABLE_RESOURCES,
  type ReportableResourceType,
} from 'src/common/types/resource.types';

export class ReportSearchDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: REPORTABLE_RESOURCES })
  @IsOptional()
  @IsEnum(REPORTABLE_RESOURCES)
  resourceType?: ReportableResourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;
}
