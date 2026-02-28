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
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminPostService } from './admin-post.service';
import { UpdatePostDto } from '../posts/dto/update-post.dto';
import {
  PostSearchDto,
  PostSearchCursorDto,
} from '../posts/dto/search-post.dto';

@ApiTags('admin-posts')
@Controller('admin/posts')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPostsController {
  constructor(private readonly adminPostService: AdminPostService) {}

  @ApiOperation({
    summary: 'Get all posts with optional search and filters (admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of posts including deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get()
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(@Query() searchDto: PostSearchDto) {
    return this.adminPostService.search(searchDto);
  }

  @ApiOperation({
    summary:
      'Get all posts with cursor pagination and optional search/filters (admin only)',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of posts with next cursor',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('cursor')
  findAllCursor(@Query() searchDto: PostSearchCursorDto) {
    return this.adminPostService.searchCursor(searchDto);
  }

  @ApiOperation({ summary: 'Search posts (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('search')
  search(@Query() searchDto: PostSearchDto) {
    return this.adminPostService.search(searchDto);
  }

  @ApiOperation({ summary: 'Search posts with cursor pagination (admin only)' })
  @ApiBearerAuth()
  @Get('search/cursor')
  searchCursor(@Query() searchDto: PostSearchCursorDto) {
    return this.adminPostService.searchCursor(searchDto);
  }

  @ApiOperation({ summary: 'Find post by ID (admin only, including deleted)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Post found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminPostService.findById(id);
  }

  @ApiOperation({ summary: 'Update any post (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 1,
  })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminPostService.update(id, body, adminId);
  }

  @ApiOperation({ summary: 'Delete any post (admin only, soft delete)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminPostService.delete(id, adminId);
  }

  @ApiOperation({ summary: 'Restore a deleted post (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Post restored successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminPostService.restore(id, adminId);
  }
}
