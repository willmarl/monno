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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Create a new comment on a resource' })
  create(@Req() req, @Body() body: CreateCommentDto) {
    const userId = req.user.sub;
    return this.commentsService.create(userId, body);
  }

  @Get('resource/:resourceType/:resourceId')
  @UseGuards(JwtAccessOptionalGuard)
  @ApiOperation({ summary: 'Get comments for a resource' })
  findByResource(
    @Param('resourceType') resourceType: string,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Query() pagination: PaginationDto,
    @Req() req,
  ) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.commentsService.findByResource(
      resourceType as any,
      resourceId,
      pagination,
      userId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAccessOptionalGuard)
  @ApiOperation({ summary: 'Get a specific comment' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.commentsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Update a comment' })
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCommentDto,
  ) {
    const userId = req.user.sub;
    return this.commentsService.update(userId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully or was already deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this comment',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.commentsService.remove(userId, id);
  }
}
