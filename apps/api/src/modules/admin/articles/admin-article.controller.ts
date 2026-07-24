import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  Post,
  HttpCode,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { mediaMulterOptions } from '../../../common/file-processing/multer-limits';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminArticleService } from './admin-article.service';
import { CreateArticleDto } from '../../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../../articles/dto/update-article.dto';
import { ReorderMediaDto } from '../../articles/dto/reorder-media.dto';
import { PaginationDto } from '../../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { ArticleSearchDto } from '../../articles/dto/search-article.dto';
import { ArticleSearchCursorDto } from '../../articles/dto/search-article.dto';
import { BulkIdsDto } from '../dto/bulk-ids.dto';

@Controller('admin/articles')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminArticlesController {
  constructor(private readonly adminArticleService: AdminArticleService) {}

  @Post()
  create(@Body() body: CreateArticleDto, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminArticleService.create(adminId, body);
  }

  // commented out as its redundant now
  // @Get()
  // findAll(@Query() pag: PaginationDto) {
  //   return this.adminArticleService.findAll(pag);
  // }
  @Get()
  search(@Query() searchDto: ArticleSearchDto) {
    return this.adminArticleService.searchAll(searchDto);
  }

  // commented out as its redundant now
  // @Get('cursor')
  // findAllCursor(@Query() pag: CursorPaginationDto) {
  //   return this.adminArticleService.findAllCursor(pag);
  // }
  @Get('cursor')
  searchCursor(@Query() searchDto: ArticleSearchCursorDto) {
    return this.adminArticleService.searchAllCursor(searchDto);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() body: BulkIdsDto, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminArticleService.bulkDelete(adminId, body.ids);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() body: BulkIdsDto, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminArticleService.bulkRestore(adminId, body.ids);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.adminArticleService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateArticleDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminArticleService.update(adminId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminArticleService.remove(adminId, id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.sub;
    return this.adminArticleService.restore(adminId, id);
  }

  // --- Media sub-routes ---
  // Note: literal routes (reorder) declared before parameterized (:mediaId)

  @UseInterceptors(FilesInterceptor('files', 10, mediaMulterOptions))
  @Post(':id/media')
  addMedia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    if (!files?.length) throw new BadRequestException('At least one file required');
    const adminId = req.user?.sub;
    return this.adminArticleService.addMediaBatch(adminId, id, files, adminId);
  }

  @Patch(':id/media/reorder')
  reorderMedia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ReorderMediaDto,
  ) {
    const adminId = req.user?.sub;
    return this.adminArticleService.reorderMedia(adminId, id, dto.ids);
  }

  @Patch(':id/media/:mediaId/primary')
  setPrimary(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminArticleService.setPrimary(adminId, id, mediaId);
  }

  @UseInterceptors(FileInterceptor('file', mediaMulterOptions))
  @Patch(':id/media/:mediaId')
  replaceMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: any,
    @UploadedFile() file: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminArticleService.replaceMedia(adminId, id, mediaId, file, adminId);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(204)
  removeMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: any,
  ) {
    const adminId = req.user?.sub;
    return this.adminArticleService.removeMedia(adminId, id, mediaId);
  }
}
