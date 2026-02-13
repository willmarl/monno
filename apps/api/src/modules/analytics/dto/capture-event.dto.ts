import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CaptureEventDto {
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
