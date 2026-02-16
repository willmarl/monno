import { IsString, MinLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @MinLength(1)
  priceId!: string;
}
