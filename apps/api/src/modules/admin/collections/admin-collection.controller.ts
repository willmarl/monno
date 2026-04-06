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
  HttpCode,
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
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminCollectionService } from './admin-collection.service';
import { UpdateCollectionDto } from '../../collections/dto/update-collection.dto';
import { CollectionSearchDto } from '../../collections/dto/search-collection.dto';

@ApiTags('admin-collections')
@Controller('admin/collections')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCollectionsController {
  constructor(
    private readonly adminCollectionService: AdminCollectionService,
  ) {}

  @ApiOperation({
    summary: 'Find collection by ID (admin only, including deleted)',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Collection ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Collection found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminCollectionService.findById(id);
  }

  @ApiOperation({
    summary:
      'Get all collections with optional search and filters (admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of collections including deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get()
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(@Query() searchDto: CollectionSearchDto) {
    return this.adminCollectionService.search(searchDto);
  }

  @ApiOperation({ summary: 'Update any collection (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Collection ID',
    example: 1,
  })
  @ApiBody({ type: UpdateCollectionDto })
  @ApiResponse({
    status: 200,
    description: 'Collection updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCollectionDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminCollectionService.update(id, body, adminId);
  }

  @ApiOperation({ summary: 'Delete any collection (admin only, soft delete)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Collection ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminCollectionService.delete(id, adminId);
  }

  @ApiOperation({ summary: 'Restore a deleted collection (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Collection ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Collection restored successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminCollectionService.restore(id, adminId);
  }
}
