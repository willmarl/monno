import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminCancelSubscriptionDto {
  @ApiProperty({
    enum: ['period_end', 'immediate'],
    description:
      'period_end = cancel_at_period_end; immediate = cancel now and drop to FREE',
  })
  @IsIn(['period_end', 'immediate'])
  mode!: 'period_end' | 'immediate';
}
