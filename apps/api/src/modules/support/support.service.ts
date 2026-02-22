import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTicketDto, userId: number | undefined) {
    await this.prisma.supportTicket.create({
      data: {
        ...data,
        userId: userId,
      },
    });

    return 'Successfully sent message';
  }
}
