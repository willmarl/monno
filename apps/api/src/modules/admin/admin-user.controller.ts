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
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UploadedFile } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import {
  UserSearchDto,
  UserSearchCursorDto,
} from '../users/dto/search-user.dto';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {} // ← Same service!

  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of all users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get()
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAllAdmin(@Query() pag: PaginationDto) {
    return this.usersService.findAllAdmin(pag);
  }

  @ApiOperation({
    summary: 'Get all users with cursor pagination (admin only)',
  })
  @ApiBearerAuth()
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
  findAllCursorAdmin(@Req() req: any, @Query() pag: CursorPaginationDto) {
    const userId = req.user?.sub ?? null;
    return this.usersService.findAllCursorAdmin(userId, pag);
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
  searchAdmin(@Query() searchDto: UserSearchDto) {
    return this.usersService.searchAllAdmin(searchDto);
  }

  @Get('search/cursor')
  searchCursorAdmin(@Query() searchDto: UserSearchCursorDto) {
    return this.usersService.searchAllCursorAdmin(searchDto);
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
  findByIdAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
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
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @UploadedFile() file?: any,
  ) {
    return this.usersService.updateAdmin(id, body, file);
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
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.removeAdmin(id);
  }

  @Get('search/suggest')
  findSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.usersService.searchSuggest(q, Number(limit));
  }
}
