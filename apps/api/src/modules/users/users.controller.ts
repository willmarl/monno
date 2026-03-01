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
  Req,
  NotFoundException,
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
import { UsersService } from './users.service';
import { CollectionsService } from '../collections/collections.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { UserSearchDto, UserSearchCursorDto } from './dto/search-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly collectionsService: CollectionsService,
  ) {}

  //==============
  //   Self
  //==============
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@Req() req: any) {
    const userId = req.user.sub;
    return this.usersService.findById(userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAccessGuard)
  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  updateMe(
    @Req() req: any,
    @Body() body: UpdateProfileDto,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.sub;
    return this.usersService.updateProfile(userId, body, file);
  }

  @ApiOperation({ summary: 'Change current user password' })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAccessGuard)
  @Patch('me/password')
  changeMyPassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    const userId = req.user.sub;
    return this.usersService.changePassword(userId, body);
  }

  @ApiOperation({ summary: 'Delete current user account' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAccessGuard)
  @Delete('me')
  @HttpCode(204)
  deleteAccount(@Req() req: any) {
    const userId = req.user.sub;
    return this.usersService.deleteAccount(userId);
  }

  //==============
  //   Public
  //==============
  @ApiOperation({ summary: 'Find user by username (public)' })
  @ApiParam({
    name: 'username',
    description: 'Username to search for',
    example: 'john_doe',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }
    return user;
  }

  @ApiOperation({ summary: 'Get user collections (public)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User collections retrieved',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAccessOptionalGuard)
  @Get(':userId/collections')
  async getUserCollections(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: PaginationDto,
  ) {
    // Verify user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Get user's collections with pagination (excludes soft-deleted)
    return this.collectionsService.findAllByUserId(userId, pag);
  }

  @ApiOperation({ summary: 'Get all users (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all public user profiles',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @Get()
  findAll(@Query() searchDto: UserSearchDto) {
    return this.usersService.searchAll(searchDto);
  }

  @ApiOperation({ summary: 'Get all users with cursor pagination (public)' })
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
    description: 'List of public user profiles with next cursor',
  })
  @Get('cursor')
  findAllCursor(@Query() searchDto: UserSearchCursorDto) {
    return this.usersService.searchAllCursor(searchDto);
  }

  @ApiOperation({ summary: 'Search users (public)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users matching search criteria',
  })
  @Get('search')
  search(@Query() searchDto: UserSearchDto) {
    return this.usersService.searchAll(searchDto);
  }

  @ApiOperation({ summary: 'Search users with cursor pagination (public)' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users matching search criteria with next cursor',
  })
  @Get('search/cursor')
  searchCursor(@Query() searchDto: UserSearchCursorDto) {
    return this.usersService.searchAllCursor(searchDto);
  }

  @ApiOperation({ summary: 'Get user search suggestions (public)' })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search query string',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 5,
    description: 'Maximum number of suggestions (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user search suggestions',
  })
  @Get('search/suggest')
  findSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.usersService.searchSuggest(q, Number(limit));
  }
}
