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

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //==============
  //   Self
  //==============
  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@Req() req: any) {
    const userId = req.user.sub;
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() body: UpdateProfileDto) {
    const userId = req.user.sub;
    return this.usersService.updateProfile(userId, body);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me/password')
  changeMyPassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    const userId = req.user.sub;
    return this.usersService.changePassword(userId, body);
  }

  //==============
  //   Public
  //==============
  // GET /users/username/bob
  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  //==============
  //   Admin
  //==============
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/id/123
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('id/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('id/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('id/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
