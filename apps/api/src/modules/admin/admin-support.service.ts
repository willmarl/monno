import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SupportSearchDto } from '../support/dto/search-ticket.dto';
import { UpdateTicketDto } from '../support/dto/update-ticket.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { AdminService } from './admin.service';

const DEFAULT_SUPPORT_SELECT = {
  id: true,
  title: true,
  message: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  adminNotes: true,
  status: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class AdminSupportService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}
  async findById(supportId: number) {
    const support = await this.prisma.supportTicket.findUnique({
      where: { id: supportId },
      select: DEFAULT_SUPPORT_SELECT,
    });

    if (!support) {
      throw new NotFoundException('Support not found');
    }

    return support;
  }

  async search(searchDto: SupportSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.supportTicket,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_SUPPORT_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async update(supportId: number, data: UpdateTicketDto, adminId: number) {
    const support = await this.prisma.supportTicket.findUnique({
      where: { id: supportId },
    });

    if (!support) {
      throw new NotFoundException('Support not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: supportId },
      data,
      select: DEFAULT_SUPPORT_SELECT,
    });

    // Log the update
    await this.adminService.log({
      adminId,
      action: 'SUPPORT_UPDATED',
      resource: 'SUPPORT',
      resourceId: supportId.toString(),
      targetId: support.id,
      description: `Admin updated support "${support.title}"`,
    });

    return updated;
  }
}
