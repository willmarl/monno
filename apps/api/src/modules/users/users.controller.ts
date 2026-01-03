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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @ApiOperation({ summary: 'Get all users (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all public user profiles',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @Get()
  findAllPublic(@Query() pag: PaginationDto) {
    return this.usersService.findAllPublic(pag);
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
  findAllCursor(@Req() req: any, @Query() pag: CursorPaginationDto) {
    const userId = req.user?.sub ?? null;
    return this.usersService.findAllCursorPublic(userId, pag);
  }
}
