import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { AdminService } from '../admin.service';
import { ReportSearchDto } from '../../reports/dto/report-search.dto';
import { UpdateReportDto } from '../../reports/dto/update-report.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { ReportStatus } from 'src/generated/prisma/client';

const DEFAULT_REPORT_SELECT = {
  id: true,
  resourceType: true,
  resourceId: true,
  reason: true,
  details: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  reporter: {
    select: { id: true, username: true, avatarPath: true },
  },
  resolver: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class AdminReportService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  async findById(id: number) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: DEFAULT_REPORT_SELECT,
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async search(searchDto: ReportSearchDto) {
    const where: any = {};
    if (searchDto.status) where.status = searchDto.status;
    if (searchDto.resourceType) where.resourceType = searchDto.resourceType;
    if (searchDto.query?.trim()) {
      const q = searchDto.query.trim();
      where.OR = [
        { details: { contains: q, mode: 'insensitive' } },
        { adminNotes: { contains: q, mode: 'insensitive' } },
        { reporter: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.report,
      limit: searchDto.limit ?? 20,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' as const },
        select: DEFAULT_REPORT_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async update(id: number, dto: UpdateReportDto, adminId: number) {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    const closing =
      dto.status === ReportStatus.RESOLVED ||
      dto.status === ReportStatus.DISMISSED;

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined
          ? { adminNotes: dto.adminNotes }
          : {}),
        ...(closing
          ? { resolvedAt: new Date(), resolverId: adminId }
          : {}),
        ...(dto.status === ReportStatus.OPEN ||
        dto.status === ReportStatus.REVIEWING
          ? { resolvedAt: null, resolverId: null }
          : {}),
      },
      select: DEFAULT_REPORT_SELECT,
    });

    await this.adminService.log({
      adminId,
      action: 'REPORT_UPDATED',
      resource: 'REPORT',
      resourceId: String(id),
      description: `Updated report #${id} status=${updated.status}`,
      changes: dto as any,
    });

    return updated;
  }
}
