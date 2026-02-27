import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

enum Status {
  OPEN = 'OPEN',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED',
}

export class UpdateTicketDto {
  @ApiProperty({
    description: 'The status of the support ticket',
    enum: Status,
    example: 'OPEN',
  })
  @IsEnum(Status)
  status: Status;

  @ApiPropertyOptional({
    description: 'Internal notes for admin reference',
    maxLength: 100,
    example: 'User provided account ID for verification',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  adminNotes: string;
}
