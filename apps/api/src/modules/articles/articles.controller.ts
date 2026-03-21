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
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(JwtAccessGuard)
  create(
    @Req() req,
    @Body() body: CreateArticleDto,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.sub;
    return this.articlesService.create(body, userId, file);
  }

  @Get(':id')
  findById(@Param('id') id: number) {
    return this.articlesService.findById(id);
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
  @UseInterceptors(FileInterceptor('image'))
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Req() req: any,
    @Body() dto: UpdateArticleDto,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.sub;
    return this.articlesService.update(id, userId, dto, file);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: number) {
    return this.articlesService.remove(id);
  }
}
