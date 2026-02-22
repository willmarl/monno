import { IsEnum, IsOptional, IsString } from 'class-validator';
enum Status {
  OPEN = 'OPEN',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED',
}

export class UpdateTicketDto {
  @IsEnum(Status)
  status: Status;

  @IsString()
  @IsOptional()
  adminNotes: string;
}
