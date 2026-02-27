import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Stripe price ID for the checkout session',
    example: 'price_1234567890abcdef',
    type: String,
  })
  @IsString()
  @MinLength(1)
  priceId!: string;
}
