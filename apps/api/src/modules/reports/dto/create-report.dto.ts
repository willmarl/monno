import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORTABLE_RESOURCES } from 'src/common/types/resource.types';
import type { ReportableResourceType } from 'src/common/types/resource.types';
import { ReportReason } from 'src/generated/prisma/client';

export class CreateReportDto {
  @ApiProperty({ enum: REPORTABLE_RESOURCES })
  @IsEnum(REPORTABLE_RESOURCES)
  resourceType!: ReportableResourceType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  resourceId!: number;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
