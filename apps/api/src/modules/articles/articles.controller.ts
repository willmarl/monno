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
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ArticleSearchDto,
  ArticleSearchCursorDto,
} from './dto/search-article.dto';
import { ReorderMediaDto } from './dto/reorder-media.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: CreateArticleDto) {
    const userId = req.user.sub;
    return this.articlesService.create(body, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get()
  search(@Query() searchDto: ArticleSearchDto, @Req() req) {
    const currentUserId = req.user?.sub;
    return this.articlesService.searchAll(searchDto, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('cursor')
  searchCursor(@Query() searchDto: ArticleSearchCursorDto, @Req() req) {
    const currentUserId = req.user?.sub;
    return this.articlesService.searchAllCursor(searchDto, currentUserId);
  }

  @Get('search/suggest')
  searchSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.articlesService.searchSuggest(q, Number(limit));
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId')
  findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: PaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub;
    return this.articlesService.findByUserId(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId/cursor')
  findByUserIdCursor(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: CursorPaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub;
    return this.articlesService.findByUserIdCursor(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId/liked')
  findLikedByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: PaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub;
    return this.articlesService.findLikedByUser(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId/liked/cursor')
  findLikedByUserCursor(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: CursorPaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub;
    return this.articlesService.findLikedByUserCursor(
      userId,
      pag,
      currentUserId,
    );
  }

  @UseGuards(JwtAccessGuard)
  @Get(':id/collections')
  getArticleCollections(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.sub;
    return this.articlesService.getCollectionsForArticle(id, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.articlesService.findById(id, userId);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, dto);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.remove(id);
  }

  // --- Media sub-routes ---
  // Note: literal routes (reorder) are declared before parameterized (:mediaId)

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @UseInterceptors(FilesInterceptor('files', 10))
  @Post(':id/media')
  addMedia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @UploadedFiles() files: any[],
  ) {
    if (!files?.length) throw new BadRequestException('At least one file required');
    return this.articlesService.addMediaBatch(id, files, req.user.sub);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id/media/reorder')
  reorderMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderMediaDto,
  ) {
    return this.articlesService.reorderMedia(id, dto.ids);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id/media/:mediaId/primary')
  setPrimary(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    return this.articlesService.setPrimary(id, mediaId);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @UseInterceptors(FileInterceptor('file'))
  @Patch(':id/media/:mediaId')
  replaceMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req,
    @UploadedFile() file: any,
  ) {
    return this.articlesService.replaceMedia(id, mediaId, file, req.user.sub);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Delete(':id/media/:mediaId')
  @HttpCode(204)
  removeMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    return this.articlesService.removeMedia(id, mediaId);
  }
}
