import { IsEnum, IsInt, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { REACTABLE_RESOURCES } from 'src/common/types/resource.types';
import type { ReactableResourceType } from 'src/common/types/resource.types';

export class ToggleReactionDto {
  @ApiProperty({ enum: REACTABLE_RESOURCES })
  @IsEnum(REACTABLE_RESOURCES)
  resourceType!: ReactableResourceType;

  @ApiProperty()
  @IsInt()
  @Min(1)
  resourceId!: number;

  @ApiProperty({
    description: 'Any emoji grapheme / ZWJ sequence (validated in service)',
    example: '🔥',
  })
  @IsString()
  @MaxLength(32)
  emoji!: string;
}
