import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CaptureEventDto {
  @ApiProperty({
    description: 'The name of the event to capture',
    example: 'user_signup',
  })
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @ApiProperty({
    description: 'Optional properties/metadata associated with the event',
    example: { userId: '123', plan: 'pro' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
