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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddCollectionItemDto } from './dto/add-collection-item.dto';
import { RemoveCollectionItemDto } from './dto/remove-collection-item.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Create a new collection
   */
  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiResponse({ status: 400, description: 'Collection name already exists' })
  create(@Req() req, @Body() body: CreateCollectionDto) {
    const userId = req.user.sub;
    return this.collectionsService.create(userId, body);
  }

  /**
   * Get all collections for authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get all collections for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
  })
  findAll(@Req() req) {
    const userId = req.user.sub;
    return this.collectionsService.findAllByUserId(userId);
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
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.collectionsService.findOne(userId, id);
  }

  /**
   * Update a collection
   */
  @Patch(':id')
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
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this collection',
  })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.collectionsService.remove(userId, id);
  }

  /**
   * Add an item to a collection
   */
  @Post(':id/items')
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
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove an item from a collection' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
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
