import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: CreateArticleDto) {
    const userId = req.user.sub;
    return this.articlesService.create(body, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.articlesService.findOne(id);
  }

  @Get()
  findAll(@Query() pag: PaginationDto) {
    return this.articlesService.findAll(pag);
  }

  @Get('cursor')
  findAllCursor(@Query() pag: CursorPaginationDto) {
    return this.articlesService.findAllCursor(pag);
  }

  @Get('users/:userId')
  findByUserId(@Param('userId') userId: number, @Query() pag: PaginationDto) {
    return this.articlesService.findByUserId(userId, pag);
  }

  @Get('users/:userId/cursor')
  findByUserIdCursor(
    @Param('userId') userId: number,
    @Query() pag: CursorPaginationDto,
  ) {
    return this.articlesService.findByUserIdCursor(userId, pag);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: number) {
    return this.articlesService.remove(id);
  }
}
