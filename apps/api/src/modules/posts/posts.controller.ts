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
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { PostSearchDto, PostSearchCursorDto } from './dto/search-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Throttle({ default: rateLimitConfig.lenient })
  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: CreatePostDto) {
    const userId = req.user.sub;
    return this.postsService.create(body, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get()
  findAll(@Query() searchDto: PostSearchDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.searchAll(searchDto, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('cursor')
  findAllCursor(@Query() searchDto: PostSearchCursorDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.searchAllCursor(searchDto, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @ApiOperation({ summary: 'Search posts with offset pagination' })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination info',
  })
  @Get('search')
  search(@Query() searchDto: PostSearchDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.searchAll(searchDto, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @ApiOperation({ summary: 'Search posts with cursor pagination' })
  @ApiResponse({
    status: 200,
    description: 'Search results with next cursor',
  })
  @Get('search/cursor')
  searchCursor(@Query() searchDto: PostSearchCursorDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.searchAllCursor(searchDto, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('search/suggest')
  findSuggest(@Query('q') q: string, @Query('limit') limit = 5, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.searchSuggest(q, Number(limit), userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('liked/:userId')
  findLikedByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: PaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.findLikedByUser(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('liked/:userId/cursor')
  findLikedByUserCursor(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: CursorPaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.findLikedByUserCursor(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId')
  findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: PaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.findByUserId(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get('users/:userId/cursor')
  findByUserIdCursor(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pag: CursorPaginationDto,
    @Req() req,
  ) {
    const currentUserId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.findByUserIdCursor(userId, pag, currentUserId);
  }

  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    summary: 'Get collections containing this post for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of collections containing the post',
  })
  @Get(':id/collections')
  getPostCollections(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.sub;
    return this.postsService.getCollectionsForPost(id, userId);
  }

  @UseGuards(JwtAccessOptionalGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.postsService.findById(id, userId);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('post')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('post')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully or was already deleted',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
