import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
} from 'class-validator';
import { BULK_IDS_MAX } from 'src/common/admin/bulk-ids';

export class BulkIdsDto {
  @ApiProperty({
    description: `Resource IDs to soft-delete or restore (max ${BULK_IDS_MAX})`,
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_IDS_MAX)
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  ids!: number[];
}
