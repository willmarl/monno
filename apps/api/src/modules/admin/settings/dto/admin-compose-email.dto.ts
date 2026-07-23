import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** Cap for targeted multi-recipient sends (not broadcast). */
export const COMPOSE_USER_IDS_CAP = 100;

export class AdminComposeEmailDto {
  @ApiProperty({ enum: ['user', 'all'] })
  @IsIn(['user', 'all'])
  audience!: 'user' | 'all';

  @ApiPropertyOptional({
    description:
      'Recipient user IDs when audience=user. Each gets a separate outbound email (not CC).',
    type: [Number],
    example: [12, 34],
  })
  @ValidateIf((o) => o.audience === 'user')
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(COMPOSE_USER_IDS_CAP)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  userIds?: number[];

  @ApiProperty({ example: 'Ticket #42 update' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({
    description: 'Plain text body (escaped to HTML; newlines preserved)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20_000)
  body!: string;

  @ApiPropertyOptional({
    description: 'Must be true when audience=all (safety confirm)',
  })
  @ValidateIf((o) => o.audience === 'all')
  @IsBoolean()
  confirmBroadcast?: boolean;
}
