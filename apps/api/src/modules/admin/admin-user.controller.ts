import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { AdminUserService } from './admin-user.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UploadedFile } from '@nestjs/common';
import {
  UserSearchDto,
  UserSearchCursorDto,
} from '../users/dto/search-user.dto';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Get all users with optional search and filters (admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get()
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(@Query() searchDto: UserSearchDto) {
    return this.adminUserService.search(searchDto);
  }

  @ApiOperation({
    summary:
      'Get all users with cursor pagination and optional search/filters (admin only)',
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
    description: 'List of users with next cursor',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('cursor')
  findAllCursor(@Query() searchDto: UserSearchCursorDto) {
    return this.adminUserService.searchCursor(searchDto);
  }

  @ApiOperation({ summary: 'Search users (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('search')
  search(@Query() searchDto: UserSearchDto) {
    return this.adminUserService.search(searchDto);
  }

  @ApiOperation({ summary: 'Search users with cursor pagination (admin only)' })
  @ApiBearerAuth()
  @Get('search/cursor')
  searchCursor(@Query() searchDto: UserSearchCursorDto) {
    return this.adminUserService.searchCursor(searchDto);
  }

  @ApiOperation({ summary: 'Find user by ID (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminUserService.findById(id);
  }

  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiBody({ type: UpdateUserAdminDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserAdminDto,
    @Req() req: any,
    @UploadedFile() file?: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminUserService.update(id, body, file, adminId);
  }

  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully or was already deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminUserService.delete(id, adminId);
  }

  @ApiOperation({ summary: 'Reset user password (admin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    const ipAddress = req.ip;
    return this.adminUserService.resetPassword(id, adminId, ipAddress);
  }
}
