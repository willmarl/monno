import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SupportTicketStatus } from '../../../generated/prisma/client';

export class UpdateTicketDto {
  @ApiProperty({
    description: 'The status of the support ticket',
    enum: SupportTicketStatus,
    example: 'OPEN',
  })
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

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
