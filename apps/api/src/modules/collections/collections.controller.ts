import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddCollectionItemDto } from './dto/add-collection-item.dto';
import { RemoveCollectionItemDto } from './dto/remove-collection-item.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@ApiBearerAuth()
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Create a new collection
   */
  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiResponse({ status: 400, description: 'Collection name already exists' })
  create(@Req() req, @Body() body: CreateCollectionDto) {
    const userId = req.user.sub;
    return this.collectionsService.create(userId, body);
  }

  /**
   * Get a specific collection with all its items
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get collection with its items' })
  @ApiResponse({
    status: 200,
    description: 'Collection retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Query() pag: PaginationDto) {
    return this.collectionsService.findOne(id, pag);
  }

  /**
   * Update a collection
   */
  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Update collection name or description' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'New collection name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCollectionDto,
  ) {
    const userId = req.user.sub;
    return this.collectionsService.update(userId, id, body);
  }

  /**
   * Delete a collection
   */
  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiResponse({
    status: 204,
    description: 'Collection deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @ApiResponse({ status: 410, description: 'Collection was already deleted' })
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.collectionsService.remove(userId, id);
  }

  /**
   * Add an item to a collection
   */
  @Post(':id/items')
  @UseGuards(JwtAccessGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Add an item to a collection' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Item already in collection or resource not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to add items to this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  addItem(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddCollectionItemDto,
  ) {
    const userId = req.user.sub;
    return this.collectionsService.addItem(userId, id, body);
  }

  /**
   * Remove an item from a collection
   */
  @Delete(':id/items')
  @UseGuards(JwtAccessGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove an item from a collection' })
  @ApiResponse({ status: 204, description: 'Item removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to remove items from this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection or item not found' })
  removeItem(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RemoveCollectionItemDto,
  ) {
    const userId = req.user.sub;
    return this.collectionsService.removeItem(userId, id, body);
  }
}
