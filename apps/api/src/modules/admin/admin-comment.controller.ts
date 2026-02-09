import {
  Controller,
  Get,
  Param,
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
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminCommentService } from './admin-comment.service';
import { CommentSearchDto } from '../comments/dto/search-comment.dto';

@ApiTags('admin-comments')
@Controller('admin/comments')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCommentsController {
  constructor(private readonly adminCommentService: AdminCommentService) {}

  @ApiOperation({
    summary: 'Get all comments with optional search and filters (admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of comments including deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get()
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({
    name: 'deleted',
    required: false,
    description: 'Filter by deleted status',
  })
  findAll(@Query() searchDto: CommentSearchDto) {
    return this.adminCommentService.search(searchDto);
  }

  @ApiOperation({ summary: 'Search comments (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('search')
  search(@Query() searchDto: CommentSearchDto) {
    return this.adminCommentService.search(searchDto);
  }

  @ApiOperation({
    summary: 'Find comment by ID (admin only, including deleted)',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Comment ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Comment found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminCommentService.findById(id);
  }

  @ApiOperation({ summary: 'Delete any comment (admin only, soft delete)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Comment ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminCommentService.delete(id, adminId);
  }

  @ApiOperation({ summary: 'Restore a deleted comment (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Comment ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Comment restored successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminCommentService.restore(id, adminId);
  }
}
