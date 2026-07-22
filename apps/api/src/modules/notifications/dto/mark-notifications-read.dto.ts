import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class MarkNotificationsReadDto {
  @ApiPropertyOptional({
    description: 'Mark these notification ids as read (must belong to caller)',
    type: [Number],
  })
  @ValidateIf((o) => !o.all)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  ids?: number[];

  @ApiPropertyOptional({
    description: 'Mark all of the caller’s notifications as read',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}
