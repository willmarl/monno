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
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { PostSearchDto, PostSearchCursorDto } from './dto/search-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: CreatePostDto) {
    const userId = req.user.sub;
    return this.postsService.create(body, userId);
  }

  @Get()
  findAll(@Query() pag: PaginationDto) {
    return this.postsService.findAll(pag);
  }

  @Get('cursor')
  findAllCursor(@Req() req: any, @Query() pag: CursorPaginationDto) {
    return this.postsService.findAllCursor(pag);
  }

  @ApiOperation({ summary: 'Search posts with offset pagination' })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination info',
  })
  @Get('search')
  search(@Query() searchDto: PostSearchDto) {
    return this.postsService.searchAll(searchDto);
  }

  @ApiOperation({ summary: 'Search posts with cursor pagination' })
  @ApiResponse({
    status: 200,
    description: 'Search results with next cursor',
  })
  @Get('search/cursor')
  searchCursor(@Query() searchDto: PostSearchCursorDto) {
    return this.postsService.searchAllCursor(searchDto);
  }

  @Get(':id')
  findById(@Param('id') id: number) {
    return this.postsService.findById(id);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('post')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('post')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.postsService.remove(id);
  }

  @Get('search/suggest')
  findSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.postsService.searchSuggest(q, Number(limit));
  }
}
