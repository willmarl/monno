import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

const DEFAULT_SUPPORT_TICKET_SELECT = {
  id: true,
  title: true,
  message: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  status: true,
};

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTicketDto, userId: number | undefined) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ...data,
        userId: userId,
      },
      select: DEFAULT_SUPPORT_TICKET_SELECT,
    });

    return ticket;
  }
}
