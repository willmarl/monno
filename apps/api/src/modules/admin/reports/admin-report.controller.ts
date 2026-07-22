import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { AdminReportService } from './admin-report.service';
import { ReportSearchDto } from '../../reports/dto/report-search.dto';
import { UpdateReportDto } from '../../reports/dto/update-report.dto';

@ApiTags('admin-reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReportsController {
  constructor(private readonly adminReportService: AdminReportService) {}

  @Get()
  findAll(@Query() searchDto: ReportSearchDto) {
    return this.adminReportService.search(searchDto);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminReportService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReportDto,
    @Req() req: any,
  ) {
    return this.adminReportService.update(id, body, Number(req.user.sub));
  }
}
