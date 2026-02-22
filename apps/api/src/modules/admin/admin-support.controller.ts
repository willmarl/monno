import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminSupportService } from './admin-support.service';
import { SupportSearchDto } from '../support/dto/search-ticket.dto';
import { UpdateTicketDto } from '../support/dto/update-ticket.dto';

@ApiTags('admin-support')
@Controller('admin/support')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSupportsController {
  constructor(private readonly adminSupportService: AdminSupportService) {}

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminSupportService.findById(id);
  }

  @Get()
  findAll(@Query() searchDto: SupportSearchDto) {
    return this.adminSupportService.search(searchDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTicketDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminSupportService.update(id, body, adminId);
  }
}
